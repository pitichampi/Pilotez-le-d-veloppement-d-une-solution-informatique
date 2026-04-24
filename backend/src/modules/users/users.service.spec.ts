import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { getRepositoryToken } from '@nestjs/typeorm'

describe('UsersService', () => {
  let service: UsersService
  let mockRepository: any

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    password: '$2b$10$hashedpassword',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockReturnValue(mockUser),
      save: jest.fn().mockResolvedValue(mockUser),
      find: jest.fn().mockResolvedValue([mockUser]),
      findOne: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: '$2b$10$hashedpassword',
      }

      const result = await service.create(createUserDto)

      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto)
      expect(mockRepository.save).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })
  })

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await service.findAll()

      expect(mockRepository.find).toHaveBeenCalled()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toContain(mockUser)
    })
  })

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = mockUser.id

      const result = await service.findOne(userId)

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null)

      const result = await service.findOne('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = mockUser.email

      const result = await service.findByEmail(email)

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email } })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user not found by email', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null)

      const result = await service.findByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update a user', async () => {
      const userId = mockUser.id
      const updateUserDto = { username: 'updateduser' }

      await service.update(userId, updateUserDto)

      expect(mockRepository.update).toHaveBeenCalledWith(userId, updateUserDto)
      expect(mockRepository.findOne).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should delete a user', async () => {
      const userId = mockUser.id

      await service.remove(userId)

      expect(mockRepository.delete).toHaveBeenCalledWith(userId)
    })
  })

  describe('toResponseDto', () => {
    it('should return user data without password', () => {
      const result = service.toResponseDto(mockUser)

      expect(result).not.toHaveProperty('password')
      expect(result.id).toBe(mockUser.id)
      expect(result.email).toBe(mockUser.email)
      expect(result.username).toBe(mockUser.username)
    })
  })
})

