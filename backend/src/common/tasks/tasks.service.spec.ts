import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TasksService } from './tasks.service'
import { File } from '@modules/files/entities/file.entity'
import * as fs from 'fs'

// Mock du module fs
jest.mock('fs')

describe('TasksService - US10 File Expiration & Automatic Purge', () => {
  let service: TasksService
  let filesRepository: Repository<File>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(File),
          useValue: {
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<TasksService>(TasksService)
    filesRepository = module.get<Repository<File>>(getRepositoryToken(File))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('deleteExpiredFiles (Cron Task)', () => {
    it('should delete expired files with expiresAt <= now', async () => {
      // Arrange
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const expiredFile: Partial<File> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        uploadToken: '123e4567-e89b-12d3-a456-426614174001',
        name: 'expired.pdf',
        originalName: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/user1/expired-file.pdf',
        storageType: 'local',
        userId: 'user1',
        tags: null,
        filePasswordHash: null,
        expiresAt: yesterday,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const validFile: Partial<File> = {
        id: '223e4567-e89b-12d3-a456-426614174000',
        uploadToken: '223e4567-e89b-12d3-a456-426614174001',
        name: 'valid.pdf',
        originalName: 'document2.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        path: '/uploads/user1/valid-file.pdf',
        storageType: 'local',
        userId: 'user1',
        tags: null,
        filePasswordHash: null,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(filesRepository.find as jest.Mock).mockResolvedValue([expiredFile, validFile])
      ;(fs.existsSync as jest.Mock).mockReturnValue(true)
      ;(fs.unlinkSync as jest.Mock).mockImplementation(() => {})
      ;(filesRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 })

      // Act
      await service.deleteExpiredFiles()

      // Assert
      expect(filesRepository.find).toHaveBeenCalled()

      expect(fs.unlinkSync).toHaveBeenCalledWith(expiredFile.path)
      expect(filesRepository.delete).toHaveBeenCalledWith(expiredFile.id)
      // Fichier valide ne doit pas être supprimé
      expect(filesRepository.delete).not.toHaveBeenCalledWith(validFile.id)
    })

    it('should handle files with no expiresAt (never expire)', async () => {
      // Arrange
      const noExpirationFile: Partial<File> = {
        id: '323e4567-e89b-12d3-a456-426614174000',
        uploadToken: '323e4567-e89b-12d3-a456-426614174001',
        name: 'permanent.pdf',
        originalName: 'document3.pdf',
        mimetype: 'application/pdf',
        size: 3072,
        path: '/uploads/user1/permanent.pdf',
        storageType: 'local',
        userId: 'user1',
        tags: null,
        filePasswordHash: null,
        expiresAt: null, // No expiration
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(filesRepository.find as jest.Mock).mockResolvedValue([noExpirationFile])

      // Act
      await service.deleteExpiredFiles()

      // Assert
      expect(fs.unlinkSync).not.toHaveBeenCalled()
      expect(filesRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle missing physical files gracefully', async () => {
      // Arrange
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const expiredFile: Partial<File> = {
        id: '423e4567-e89b-12d3-a456-426614174000',
        uploadToken: '423e4567-e89b-12d3-a456-426614174001',
        name: 'missing.pdf',
        originalName: 'missing.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/user1/missing-file.pdf',
        storageType: 'local',
        userId: 'user1',
        tags: null,
        filePasswordHash: null,
        expiresAt: yesterday,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(filesRepository.find as jest.Mock).mockResolvedValue([expiredFile])
      ;(fs.existsSync as jest.Mock).mockReturnValue(false) // File doesn't exist
      ;(filesRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 })

      // Act
      await service.deleteExpiredFiles()

      // Assert - Should still delete from DB even if file doesn't exist
      expect(filesRepository.delete).toHaveBeenCalledWith(expiredFile.id)
    })

    it('should continue purging even if one file deletion fails', async () => {
      // Arrange
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const failingFile: Partial<File> = {
        id: '523e4567-e89b-12d3-a456-426614174000',
        uploadToken: '523e4567-e89b-12d3-a456-426614174001',
        name: 'failing.pdf',
        originalName: 'failing.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/user1/failing.pdf',
        storageType: 'local',
        userId: 'user1',
        tags: null,
        filePasswordHash: null,
        expiresAt: yesterday,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const successFile: Partial<File> = {
        id: '623e4567-e89b-12d3-a456-426614174000',
        uploadToken: '623e4567-e89b-12d3-a456-426614174001',
        name: 'success.pdf',
        originalName: 'success.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        path: '/uploads/user1/success.pdf',
        storageType: 'local',
        userId: 'user1',
        tags: null,
        filePasswordHash: null,
        expiresAt: yesterday,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(filesRepository.find as jest.Mock).mockResolvedValue([failingFile, successFile])
      ;(fs.existsSync as jest.Mock).mockReturnValue(true)
      ;(fs.unlinkSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Permission denied')
      })
      ;(filesRepository.delete as jest.Mock).mockImplementation((id) => {
        if (id === failingFile.id) {
          return Promise.reject(new Error('DB delete failed'))
        }
        return Promise.resolve({ affected: 1 })
      })

      // Act
      await expect(service.deleteExpiredFiles()).resolves.not.toThrow()

      // Assert - Should attempt to delete both files
      expect(filesRepository.delete).toHaveBeenCalledWith(failingFile.id)
      expect(filesRepository.delete).toHaveBeenCalledWith(successFile.id)
    })

    it('should return without errors when no expired files exist', async () => {
      // Arrange
      ;(filesRepository.find as jest.Mock).mockResolvedValue([])

      // Act
      await expect(service.deleteExpiredFiles()).resolves.not.toThrow()

      // Assert
      expect(fs.unlinkSync).not.toHaveBeenCalled()
      expect(filesRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      ;(filesRepository.find as jest.Mock).mockRejectedValue(new Error('DB connection failed'))

      // Act
      await expect(service.deleteExpiredFiles()).resolves.not.toThrow()

      // Assert - Should log error but not throw
      expect(fs.unlinkSync).not.toHaveBeenCalled()
    })
  })

  describe('purgeExpiredFilesManually', () => {
    it('should return count of deleted files', async () => {
      // Arrange
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const expiredFile: Partial<File> = {
        id: '723e4567-e89b-12d3-a456-426614174000',
        uploadToken: '723e4567-e89b-12d3-a456-426614174001',
        name: 'expired.pdf',
        originalName: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/user1/expired-file.pdf',
        storageType: 'local',
        userId: 'user1',
        tags: null,
        filePasswordHash: null,
        expiresAt: yesterday,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(filesRepository.find as jest.Mock).mockResolvedValue([expiredFile])
      ;(fs.existsSync as jest.Mock).mockReturnValue(true)
      ;(fs.unlinkSync as jest.Mock).mockImplementation(() => {})
      ;(filesRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 })

      // Act
      const result = await service.purgeExpiredFilesManually()

      // Assert
      expect(result).toBe(1)
      expect(filesRepository.delete).toHaveBeenCalledWith(expiredFile.id)
    })

    it('should return count of deleted files', async () => {
      // Arrange
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const files: Partial<File>[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `${i}23e4567-e89b-12d3-a456-426614174000`,
          uploadToken: `${i}23e4567-e89b-12d3-a456-426614174001`,
          name: `file${i}.pdf`,
          originalName: `file${i}.pdf`,
          mimetype: 'application/pdf',
          size: 1024,
          path: `/uploads/user1/file${i}.pdf`,
          storageType: 'local',
          userId: 'user1',
          tags: null,
          filePasswordHash: null,
          expiresAt: yesterday,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))

      ;(filesRepository.find as jest.Mock).mockResolvedValue(files)
      ;(fs.existsSync as jest.Mock).mockReturnValue(true)
      ;(fs.unlinkSync as jest.Mock).mockImplementation(() => {})
      ;(filesRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 })

      // Act
      const result = await service.purgeExpiredFilesManually()

      // Assert
      expect(result).toBe(5)
    })
  })
})










