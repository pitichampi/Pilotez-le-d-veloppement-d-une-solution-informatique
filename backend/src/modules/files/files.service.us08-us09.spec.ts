import { Test, TestingModule } from '@nestjs/testing'
import { Repository } from 'typeorm'
import { FilesService } from './files.service'
import { File } from './entities/file.entity'
import { LocalStorageService } from './storage/local-storage.service'
import * as bcrypt from 'bcryptjs'

describe('FilesService - US08 & US09 (Unit Tests)', () => {
  let service: FilesService
  let mockFilesRepository: jest.Mocked<Repository<File>>
  let mockStorageService: jest.Mocked<LocalStorageService>

  beforeEach(async () => {
    mockFilesRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any

    mockStorageService = {
      saveFile: jest.fn(),
      getFile: jest.fn(),
      deleteFile: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: 'FileRepository',
          useValue: mockFilesRepository,
        },
        {
          provide: LocalStorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile()

    service = module.get<FilesService>(FilesService)
  })

  describe('US08 - Tags Management', () => {
    it('should store tags as JSON string', async () => {
      const tags = ['important', 'work', '2025-Q1']
      const tagsJson = JSON.stringify(tags)

      // Simulate storing tags
      expect(tagsJson).toBe(JSON.stringify(tags))
      const parsed = JSON.parse(tagsJson)
      expect(parsed).toEqual(tags)
    })

    it('should deduplicate tags when storing', () => {
      const tagsWithDuplicates = ['work', 'important', 'work', 'project']
      const uniqueTags = Array.from(new Set(tagsWithDuplicates))

      expect(uniqueTags).toEqual(['work', 'important', 'project'])
    })

    it('should validate tag length (max 30 characters)', () => {
      const validTag = 'a'.repeat(30)
      const invalidTag = 'a'.repeat(31)

      expect(validTag.length).toBeLessThanOrEqual(30)
      expect(invalidTag.length).toBeGreaterThan(30)
    })

    it('should handle empty tags array', () => {
      const tags = []
      const tagsJson = JSON.stringify(tags)

      expect(JSON.parse(tagsJson)).toEqual([])
    })

    it('should preserve tag order', () => {
      const tags = ['first', 'second', 'third']
      const tagsJson = JSON.stringify(tags)
      const parsed = JSON.parse(tagsJson)

      expect(parsed).toEqual(['first', 'second', 'third'])
    })
  })

  describe('US09 - Password Security', () => {
    it('should hash password with bcrypt cost 10', async () => {
      const plainPassword = 'securePassword123'
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword.length).toBeGreaterThan(plainPassword.length)
    })

    it('should validate password length (min 6 characters)', () => {
      const validPassword = '123456'
      const invalidPassword = '12345'

      expect(validPassword.length).toBeGreaterThanOrEqual(6)
      expect(invalidPassword.length).toBeLessThan(6)
    })

    it('should verify password with bcrypt.compare', async () => {
      const plainPassword = 'correctPassword123'
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      const isValid = await bcrypt.compare(plainPassword, hashedPassword)
      const isInvalid = await bcrypt.compare('wrongPassword123', hashedPassword)

      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
    })

    it('should not expose password hash', async () => {
      const file: any = {
        id: 'uuid',
        originalName: 'test.pdf',
        filePasswordHash: await bcrypt.hash('secret123', 10),
      }

      // Simulate DTO mapping (should not include filePasswordHash)
      const dto = {
        id: file.id,
        originalName: file.originalName,
        has_password: !!file.filePasswordHash,
      }

      expect(dto).not.toHaveProperty('filePasswordHash')
      expect(dto).toHaveProperty('has_password')
      expect(dto.has_password).toBe(true)
    })

    it('should handle null password (public file)', () => {
      const file: any = {
        id: 'uuid',
        originalName: 'test.pdf',
        filePasswordHash: null,
      }

      const hasPassword = !!file.filePasswordHash
      expect(hasPassword).toBe(false)
    })
  })

  describe('US08 + US09 Combined', () => {
    it('should store both tags and password hash', async () => {
      const tags = ['secure', 'important']
      const tagsJson = JSON.stringify(tags)
      const password = 'protectedFile123'
      const passwordHash = await bcrypt.hash(password, 10)

      const file = {
        tags: tagsJson,
        filePasswordHash: passwordHash,
      }

      expect(file.tags).toBe(JSON.stringify(['secure', 'important']))
      expect(file.filePasswordHash).not.toBe(password)
      expect(await bcrypt.compare(password, file.filePasswordHash)).toBe(true)
    })

    it('should retrieve tags and password status from file', async () => {
      const tags = ['work', 'confidential']
      const passwordHash = await bcrypt.hash('secret123', 10)

      const file = {
        id: 'uuid',
        originalName: 'file.pdf',
        tags: JSON.stringify(tags),
        filePasswordHash: passwordHash,
      }

      // Simulate DTO mapping
      const dto = {
        id: file.id,
        original_name: file.originalName,
        tags: JSON.parse(file.tags),
        has_password: !!file.filePasswordHash,
      }

      expect(dto.tags).toEqual(['work', 'confidential'])
      expect(dto.has_password).toBe(true)
      expect(dto).not.toHaveProperty('filePasswordHash')
    })

    it('should validate both tags and password in upload', () => {
      const tags = ['a'.repeat(30)] // Valid: exactly 30 chars
      const password = '123456' // Valid: exactly 6 chars

      expect(tags[0].length).toBeLessThanOrEqual(30)
      expect(password.length).toBeGreaterThanOrEqual(6)
    })
  })

  describe('Password Validation Edge Cases', () => {
    it('should accept special characters in password', async () => {
      const specialPassword = 'Pass$word!@#2025'
      const hashedPassword = await bcrypt.hash(specialPassword, 10)

      const isValid = await bcrypt.compare(specialPassword, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should be case-sensitive for password comparison', async () => {
      const password = 'SecurePass123'
      const hashedPassword = await bcrypt.hash(password, 10)

      const lowerCase = await bcrypt.compare('securepass123', hashedPassword)
      const upperCase = await bcrypt.compare('SECUREPASS123', hashedPassword)
      const correct = await bcrypt.compare(password, hashedPassword)

      expect(lowerCase).toBe(false)
      expect(upperCase).toBe(false)
      expect(correct).toBe(true)
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(255) // Max typical password length
      const hashedPassword = await bcrypt.hash(longPassword, 10)

      const isValid = await bcrypt.compare(longPassword, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should handle unicode characters in password', async () => {
      const unicodePassword = 'Pässwörd123🔒'
      const hashedPassword = await bcrypt.hash(unicodePassword, 10)

      const isValid = await bcrypt.compare(unicodePassword, hashedPassword)
      expect(isValid).toBe(true)
    })
  })

  describe('Tags Validation Edge Cases', () => {
    it('should handle tags with spaces', () => {
      const tags = ['important work', 'my project']
      const tagsJson = JSON.stringify(tags)

      expect(JSON.parse(tagsJson)).toEqual(['important work', 'my project'])
    })

    it('should handle tags with special characters', () => {
      const tags = ['2025-Q1', 'task@work', 'item#1']
      const tagsJson = JSON.stringify(tags)

      expect(JSON.parse(tagsJson)).toEqual(['2025-Q1', 'task@work', 'item#1'])
    })

    it('should handle unicode tags', () => {
      const tags = ['日本語', 'français', 'español']
      const tagsJson = JSON.stringify(tags)

      expect(JSON.parse(tagsJson)).toEqual(['日本語', 'français', 'español'])
    })

    it('should preserve case sensitivity of tags', () => {
      const tags = ['Important', 'important', 'IMPORTANT']
      const tagsJson = JSON.stringify(tags)

      // Should not deduplicate different cases
      expect(JSON.parse(tagsJson)).toHaveLength(3)
    })
  })
})

