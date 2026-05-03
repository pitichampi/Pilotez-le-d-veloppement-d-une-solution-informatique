import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { FilesService } from './files.service'
import { File } from './entities/file.entity'
import { LocalStorageService } from './storage/local-storage.service'
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'

jest.mock('bcryptjs')

describe('FilesService', () => {
  let service: FilesService
  let filesRepository: Repository<File>
  let storageService: LocalStorageService

  const mockFile: any = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: '/tmp/uploads',
    filename: 'test-1704844800-test.pdf',
    path: '/tmp/uploads/test-1704844800-test.pdf',
    buffer: Buffer.from('test content'),
  }

  const mockFileEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    uploadToken: '550e8400-e29b-41d4-a716-446655440000',
    name: 'test.pdf',
    originalName: 'test.pdf',
    size: 1024,
    mimetype: 'application/pdf',
    path: '/app/uploads/123e4567/test.pdf',
    storageType: 'local',
    userId: 'user-123',
    tags: null,
    filePasswordHash: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(File),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: LocalStorageService,
          useValue: {
            saveFile: jest.fn(),
            getFile: jest.fn(),
            deleteFile: jest.fn(),
            fileExists: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<FilesService>(FilesService)
    filesRepository = module.get<Repository<File>>(getRepositoryToken(File))
    storageService = module.get<LocalStorageService>(LocalStorageService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create and save a file successfully', async () => {
      const createFileDto = {
        expirationDays: 7,
        tags: ['important', 'work'],
      }

      jest.spyOn(filesRepository, 'create').mockReturnValue(mockFileEntity as any)
      jest.spyOn(filesRepository, 'save').mockResolvedValue(mockFileEntity as any)
      jest.spyOn(storageService, 'saveFile').mockResolvedValue('/app/uploads/user-123/550e8400-test.pdf')

      const result = await service.create(mockFile, 'user-123', createFileDto)

      expect(storageService.saveFile).toHaveBeenCalled()
      expect(filesRepository.create).toHaveBeenCalled()
      expect(filesRepository.save).toHaveBeenCalled()
      expect(result).toHaveProperty('uploadToken')
      expect(result).toHaveProperty('id')
      expect(result).not.toHaveProperty('path') // Chemin ne doit pas être exposé
    })

    it('should throw BadRequestException if no file provided', async () => {
      await expect(service.create(null, 'user-123')).rejects.toThrow(BadRequestException)
    })

    it('should calculate expiration date correctly', async () => {
      const createFileDto = {
        expirationDays: 3,
      }

      jest.spyOn(filesRepository, 'create').mockReturnValue(mockFileEntity as any)
      jest.spyOn(filesRepository, 'save').mockResolvedValue(mockFileEntity as any)
      jest.spyOn(storageService, 'saveFile').mockResolvedValue('/app/uploads/user-123/550e8400-test.pdf')

      await service.create(mockFile, 'user-123', createFileDto)

      const createCall = filesRepository.create as jest.Mock
      const createdEntity = createCall.mock.calls[0][0]
      expect(createdEntity.expiresAt).toBeDefined()
      expect((createdEntity.expiresAt as Date).getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('findOne', () => {
    it('should return a file by id', async () => {
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(mockFileEntity as any)

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000')

      expect(filesRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      })
      expect(result).toEqual(mockFileEntity)
    })

    it('should return null if file not found', async () => {
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(null)

      const result = await service.findOne('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('findByUploadToken', () => {
    it('should return a file by uploadToken', async () => {
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(mockFileEntity as any)

      const result = await service.findByUploadToken('550e8400-e29b-41d4-a716-446655440000')

      expect(filesRepository.findOne).toHaveBeenCalledWith({
        where: { uploadToken: '550e8400-e29b-41d4-a716-446655440000' },
      })
      expect(result).toEqual(mockFileEntity)
    })
  })

  describe('remove', () => {
    it('should delete a file if user is the owner', async () => {
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(mockFileEntity as any)
      jest.spyOn(storageService, 'deleteFile').mockResolvedValue(undefined)
      jest.spyOn(filesRepository, 'delete').mockResolvedValue({ affected: 1 } as any)

      await service.remove('123e4567-e89b-12d3-a456-426614174000', 'user-123')

      expect(storageService.deleteFile).toHaveBeenCalledWith(mockFileEntity.path)
      expect(filesRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should throw ForbiddenException if user is not the owner', async () => {
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(mockFileEntity as any)

      await expect(
        service.remove('123e4567-e89b-12d3-a456-426614174000', 'different-user-id'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw NotFoundException if file not found', async () => {
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(null)

      await expect(
        service.remove('non-existent-id', 'user-123'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return all files for a user', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockFileEntity]),
      }

      jest.spyOn(filesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any)

      const result = await service.findAll('user-123')

      expect(filesRepository.createQueryBuilder).toHaveBeenCalledWith('file')
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('file.userId = :userId', { userId: 'user-123' })
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('(file.expiresAt IS NULL OR file.expiresAt > :now)', { now: expect.any(Date) })
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('file.createdAt', 'DESC')
      expect(result).toEqual([{
        id: '123e4567-e89b-12d3-a456-426614174000',
        token: '550e8400-e29b-41d4-a716-446655440000',
        download_url: 'http://localhost:3000/d/550e8400-e29b-41d4-a716-446655440000',
        original_name: 'test.pdf',
        size_bytes: 1024,
        mime_type: 'application/pdf',
        expires_at: null,
        has_password: false,
        tags: [],
      }])
    })

    it('should include expired files when includeExpired is true', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockFileEntity]),
      }

      jest.spyOn(filesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any)

      const result = await service.findAll('user-123', true)

      expect(filesRepository.createQueryBuilder).toHaveBeenCalledWith('file')
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('file.userId = :userId', { userId: 'user-123' })
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled()
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('file.createdAt', 'DESC')
      expect(result).toEqual([{
        id: '123e4567-e89b-12d3-a456-426614174000',
        token: '550e8400-e29b-41d4-a716-446655440000',
        download_url: 'http://localhost:3000/d/550e8400-e29b-41d4-a716-446655440000',
        original_name: 'test.pdf',
        size_bytes: 1024,
        mime_type: 'application/pdf',
        expires_at: null,
        has_password: false,
        tags: [],
      }])
    })
  })

  describe('getFileBuffer', () => {
    it('should return file buffer', async () => {
      const mockBuffer = Buffer.from('file content')
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(mockFileEntity as any)
      jest.spyOn(storageService, 'getFile').mockResolvedValue(mockBuffer)

      const result = await service.getFileBuffer('123e4567-e89b-12d3-a456-426614174000')

      expect(result).toEqual(mockBuffer)
      expect(storageService.getFile).toHaveBeenCalledWith(mockFileEntity.path)
    })

    it('should throw NotFoundException if file not found', async () => {
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(null)

      await expect(service.getFileBuffer('non-existent-id')).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException if storage throws error', async () => {
      jest.spyOn(filesRepository, 'findOne').mockResolvedValue(mockFileEntity as any)
      jest.spyOn(storageService, 'getFile').mockRejectedValue(new Error('Storage error'))

      await expect(service.getFileBuffer('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('US02 - Download', () => {
    describe('getDownloadMetadata', () => {
      it('should return file metadata without sensitive data', async () => {
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(mockFileEntity as any)

        const result = await service.getDownloadMetadata('550e8400-e29b-41d4-a716-446655440000')

        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('uploadToken')
        expect(result).toHaveProperty('originalName')
        expect(result).toHaveProperty('size')
        expect(result).toHaveProperty('mimetype')
        expect(result).toHaveProperty('isPasswordProtected', false)
        expect(result).not.toHaveProperty('path')
      })

      it('should throw NotFoundException if file not found', async () => {
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(null)

        await expect(
          service.getDownloadMetadata('invalid-token'),
        ).rejects.toThrow(NotFoundException)
      })

      it('should throw BadRequestException if file has expired', async () => {
        const expiredFile = {
          ...mockFileEntity,
          expiresAt: new Date(Date.now() - 1000),
        }
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(expiredFile as any)

        await expect(
          service.getDownloadMetadata('550e8400-e29b-41d4-a716-446655440000'),
        ).rejects.toThrow(BadRequestException)
      })

      it('should indicate password protection status', async () => {
        const protectedFile = {
          ...mockFileEntity,
          filePasswordHash: '$2a$10$hashedpassword',
        }
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(protectedFile as any)

        const result = await service.getDownloadMetadata('550e8400-e29b-41d4-a716-446655440000')

        expect(result.isPasswordProtected).toBe(true)
      })
    })

    describe('downloadFile', () => {
      it('should download file without password protection', async () => {
        const mockBuffer = Buffer.from('file content')
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(mockFileEntity as any)
        jest.spyOn(storageService, 'getFile').mockResolvedValue(mockBuffer)

        const result = await service.downloadFile('550e8400-e29b-41d4-a716-446655440000')

        expect(result).toEqual(mockBuffer)
      })

      it('should throw NotFoundException if file not found', async () => {
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(null)

        await expect(
          service.downloadFile('invalid-token'),
        ).rejects.toThrow(NotFoundException)
      })

      it('should throw BadRequestException if file has expired', async () => {
        const expiredFile = {
          ...mockFileEntity,
          expiresAt: new Date(Date.now() - 1000),
        }
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(expiredFile as any)

        await expect(
          service.downloadFile('550e8400-e29b-41d4-a716-446655440000'),
        ).rejects.toThrow(BadRequestException)
      })

      it('should throw BadRequestException if password is required but not provided', async () => {
        const protectedFile = {
          ...mockFileEntity,
          filePasswordHash: '$2a$10$hashedpassword',
        }
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(protectedFile as any)

        await expect(
          service.downloadFile('550e8400-e29b-41d4-a716-446655440000'),
        ).rejects.toThrow(BadRequestException)
      })

      it('should throw BadRequestException if password is incorrect', async () => {
        const protectedFile = {
          ...mockFileEntity,
          filePasswordHash: '$2a$10$hashedpassword',
        }
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(protectedFile as any)
        ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

        await expect(
          service.downloadFile('550e8400-e29b-41d4-a716-446655440000', 'wrongpassword'),
        ).rejects.toThrow(BadRequestException)
      })

      it('should download file with correct password', async () => {
        const mockBuffer = Buffer.from('file content')
        const protectedFile = {
          ...mockFileEntity,
          filePasswordHash: '$2a$10$hashedpassword',
        }
        jest.spyOn(filesRepository, 'findOne').mockResolvedValue(protectedFile as any)
        ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)
        jest.spyOn(storageService, 'getFile').mockResolvedValue(mockBuffer)

        const result = await service.downloadFile('550e8400-e29b-41d4-a716-446655440000', 'correctpassword')

        expect(result).toEqual(mockBuffer)
      })
    })

    describe('isFileExpired', () => {
      it('should return false if file has no expiration', () => {
        const file = { ...mockFileEntity, expiresAt: null }

        const result = service.isFileExpired(file as any)

        expect(result).toBe(false)
      })

      it('should return false if file has not expired', () => {
        const futureDate = new Date(Date.now() + 1000)
        const file = { ...mockFileEntity, expiresAt: futureDate }

        const result = service.isFileExpired(file as any)

        expect(result).toBe(false)
      })

      it('should return true if file has expired', () => {
        const pastDate = new Date(Date.now() - 1000)
        const file = { ...mockFileEntity, expiresAt: pastDate }

        const result = service.isFileExpired(file as any)

        expect(result).toBe(true)
      })
    })

    describe('createWithPassword', () => {
      it('should create file with password protection', async () => {
        const createFileDto = {
          filePassword: 'SecurePassword123',
          expirationDays: 7,
        }

        ;(bcrypt.hash as jest.Mock).mockResolvedValueOnce('$2a$10$hashedpassword')
        jest.spyOn(filesRepository, 'create').mockReturnValue(mockFileEntity as any)
        jest.spyOn(filesRepository, 'save').mockResolvedValue(mockFileEntity as any)
        jest.spyOn(storageService, 'saveFile').mockResolvedValue('/app/uploads/user-123/550e8400-test.pdf')

        const result = await service.createWithPassword(mockFile, 'user-123', createFileDto)

        expect(bcrypt.hash).toHaveBeenCalledWith('SecurePassword123', 10)
        expect(filesRepository.create).toHaveBeenCalled()
        expect(filesRepository.save).toHaveBeenCalled()
        expect(result).toHaveProperty('uploadToken')
        expect(result).toHaveProperty('id')
      })

      it('should create file without password if not provided', async () => {
        const createFileDto = {
          expirationDays: 7,
        }

        jest.spyOn(filesRepository, 'create').mockReturnValue(mockFileEntity as any)
        jest.spyOn(filesRepository, 'save').mockResolvedValue(mockFileEntity as any)
        jest.spyOn(storageService, 'saveFile').mockResolvedValue('/app/uploads/user-123/550e8400-test.pdf')

        await service.createWithPassword(mockFile, 'user-123', createFileDto)

        const createCall = filesRepository.create as jest.Mock
        const createdEntity = createCall.mock.calls[0][0]
        expect(createdEntity.filePasswordHash).toBeNull()
      })

      it('should throw BadRequestException if no file provided', async () => {
        await expect(service.createWithPassword(null, 'user-123')).rejects.toThrow(BadRequestException)
      })
    })
  })
})
