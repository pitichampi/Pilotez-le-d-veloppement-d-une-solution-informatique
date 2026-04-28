import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request = require('supertest')
import { AppModule } from '../src/app.module'

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/auth/register', () => {
    const validRegisterDto = {
      email: `newuser-${Date.now()}@example.com`,
      username: 'newuser',
      password: 'securePassword123',
    }

    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validRegisterDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token')
          expect(res.body).toHaveProperty('user')
          expect(res.body.user.email).toBe(validRegisterDto.email)
          expect(res.body.user.username).toBe(validRegisterDto.username)
          expect(res.body.user).not.toHaveProperty('password')
        })
    })

    it('should reject registration with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'securePassword123',
        })
        .expect(400)
    })

    it('should reject registration with short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'short', // Less than 8 characters
        })
        .expect(400)
    })

    it('should reject registration with short username', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'ab', // Less than 3 characters
          password: 'securePassword123',
        })
        .expect(400)
    })

    it('should reject registration if email already exists', () => {
      const existingUserDto = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'securePassword123',
      }

      // First registration
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(existingUserDto)
        .then(() => {
          // Try to register again with same email
          return request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
              ...existingUserDto,
              username: 'differentuser',
            })
            .expect(400)
        })
    })
  })

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: `login-test-${Date.now()}@example.com`,
      username: 'logintestuser',
      password: 'securePassword123',
    }

    beforeAll(() => {
      // Register a user for login tests
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
    })

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token')
          expect(res.body).toHaveProperty('user')
          expect(res.body.user.email).toBe(testUser.email)
        })
    })

    it('should reject login with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401)
    })

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword123',
        })
        .expect(401)
    })

    it('should reject login with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .expect(400)
    })

    it('should reject login with short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'short',
        })
        .expect(400)
    })
  })

  describe('GET /api/auth/me', () => {
    let authToken: string

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'me-test@example.com',
          username: 'metestuser',
          password: 'securePassword123',
        })

      authToken = response.body.token
    })

    it('should return current user info with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id')
          expect(res.body).toHaveProperty('email')
        })
    })

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401)
    })

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })
  })
})

