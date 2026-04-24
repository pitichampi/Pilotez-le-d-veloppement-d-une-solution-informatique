import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { UsersService } from '@modules/users/users.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'

jest.mock('bcryptjs')

describe('AuthService', () => {
  let service: AuthService
  let usersService: UsersService
  let jwtService: JwtService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_EXPIRATION: '3600',
              }
              return config[key]
            }),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    usersService = module.get<UsersService>(UsersService)
    jwtService = module.get<JwtService>(JwtService)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'securePassword123',
    }

    const hashedPassword = '$2b$10$hashedpassword'
    const user = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: registerDto.email,
      username: registerDto.username,
      password: hashedPassword,
      createdAt: new Date(),
    }

    it('should register a new user successfully', async () => {
      jest.mocked(usersService.findByEmail).mockResolvedValue(null)
      ;(jest.mocked(bcrypt.hash) as any).mockResolvedValue(hashedPassword)
      jest.mocked(usersService.create).mockResolvedValue(user as any)
      jest.mocked(jwtService.sign).mockReturnValue('jwt-token')

      const result = await service.register(registerDto)

      expect(result.token).toBe('jwt-token')
      expect(result.user.email).toBe(registerDto.email)
      expect(result.user.username).toBe(registerDto.username)
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10)
      expect(usersService.create).toHaveBeenCalled()
    })

    it('should throw BadRequestException if email already exists', async () => {
      jest.mocked(usersService.findByEmail).mockResolvedValue(user as any)

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should use bcrypt cost of 10', async () => {
      jest.mocked(usersService.findByEmail).mockResolvedValue(null)
      ;(jest.mocked(bcrypt.hash) as any).mockResolvedValue(hashedPassword)
      jest.mocked(usersService.create).mockResolvedValue(user as any)
      jest.mocked(jwtService.sign).mockReturnValue('jwt-token')

      await service.register(registerDto)

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10)
    })
  })

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'securePassword123',
    }

    const hashedPassword = '$2b$10$hashedpassword'
    const user = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: loginDto.email,
      username: 'testuser',
      password: hashedPassword,
      createdAt: new Date(),
    }

    it('should login a user successfully', async () => {
      jest.mocked(usersService.findByEmail).mockResolvedValue(user as any)
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never)
      jest.mocked(jwtService.sign).mockReturnValue('jwt-token')

      const result = await service.login(loginDto)

      expect(result.token).toBe('jwt-token')
      expect(result.user.email).toBe(loginDto.email)
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password)
    })

    it('should throw UnauthorizedException if user not found', async () => {
      jest.mocked(usersService.findByEmail).mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException if password is invalid', async () => {
      jest.mocked(usersService.findByEmail).mockResolvedValue(user as any)
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never)

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe('validateToken', () => {
    const token = 'valid-jwt-token'
    const payload = { sub: '123', email: 'test@example.com' }

    it('should validate a valid token', async () => {
      jest.mocked(jwtService.verify).mockReturnValue(payload)

      const result = await service.validateToken(token)

      expect(result).toEqual(payload)
      expect(jwtService.verify).toHaveBeenCalledWith(token)
    })

    it('should throw UnauthorizedException for invalid token', async () => {
      jest.mocked(jwtService.verify).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})

