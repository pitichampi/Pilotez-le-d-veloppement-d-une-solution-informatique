import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request = require('supertest')
import { AppModule } from '../src/app.module'

describe('US09 - File Security & Password Protection (e2e)', () => {
  let app: INestApplication
  let authToken: string
  let userId: string
  let uploadToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()

    // Créer un utilisateur de test
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `password-test-${Date.now()}@example.com`,
        username: 'securityuser',
        password: 'securePassword123',
      })

    authToken = registerRes.body.token
    userId = registerRes.body.user.id
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/files/upload - US09 Password Protection', () => {
    it('should upload file without password protection (public file)', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'public.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('has_password')
          expect(res.body.has_password).toBe(false)
        })
    })

    it('should upload file with password protection', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('filePassword', 'secure123')
        .attach('file', pdfBuffer, 'protected.pdf')
        .expect(201)

      expect(res.body).toHaveProperty('has_password')
      expect(res.body.has_password).toBe(true)
      uploadToken = res.body.uploadToken
    })

    it('should reject password less than 6 characters', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('filePassword', 'short')
        .attach('file', pdfBuffer, 'short-pass.pdf')
        .expect(400)
    })

    it('should accept password with exactly 6 characters', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('filePassword', '123456')
        .attach('file', pdfBuffer, 'min-pass.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body.has_password).toBe(true)
        })
    })

    it('should accept long passwords', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')
      const longPassword = 'VerySecurePassword2025$#@!ComplexPassword123'

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('filePassword', longPassword)
        .attach('file', pdfBuffer, 'long-pass.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body.has_password).toBe(true)
        })
    })
  })

  describe('POST /api/files/{token}/download - Password Validation', () => {
    let protectedToken: string

    beforeAll(async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test content', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('filePassword', 'protectedFile123')
        .attach('file', pdfBuffer, 'protected-download.pdf')
        .expect(201)

      protectedToken = res.body.uploadToken
    })

    it('should deny download without password for protected file', () => {
      return request(app.getHttpServer())
        .post(`/api/files/share/${protectedToken}/download`)
        .send({})
        .expect(400)
    })

    it('should deny download with incorrect password', () => {
      return request(app.getHttpServer())
        .post(`/api/files/share/${protectedToken}/download`)
        .send({ password: 'wrongPassword123' })
        .expect(400)
    })

    it('should allow download with correct password', () => {
      return request(app.getHttpServer())
        .post(`/api/files/share/${protectedToken}/download`)
        .send({ password: 'protectedFile123' })
        .expect(200)
    })

    it('should not expose password hash in response', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/files/share/${protectedToken}/metadata`)
        .expect(200)

      expect(res.body).not.toHaveProperty('filePasswordHash')
      expect(res.body).toHaveProperty('has_password')
      expect(res.body.has_password).toBe(true)
    })
  })

  describe('GET /api/files - Password Status in List', () => {
    it('should show password protection status in file list', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      // Upload protected file
      await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('filePassword', 'listProtected123')
        .attach('file', pdfBuffer, 'list-protected.pdf')
        .expect(201)

      // Retrieve list
      const listRes = await request(app.getHttpServer())
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const protectedFile = listRes.body.find((f: any) => f.original_name === 'list-protected.pdf')
      expect(protectedFile).toBeDefined()
      expect(protectedFile.has_password).toBe(true)
      expect(protectedFile).not.toHaveProperty('filePasswordHash')
    })

    it('should show no password for unprotected files', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      // Upload unprotected file
      await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'list-public.pdf')
        .expect(201)

      // Retrieve list
      const listRes = await request(app.getHttpServer())
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const publicFile = listRes.body.find((f: any) => f.original_name === 'list-public.pdf')
      expect(publicFile).toBeDefined()
      expect(publicFile.has_password).toBe(false)
    })
  })

  describe('US08 + US09 Combined - Tags and Password', () => {
    it('should upload file with both tags and password', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify(['secure', 'important']))
        .field('filePassword', 'combined123')
        .attach('file', pdfBuffer, 'combined.pdf')
        .expect(201)

      expect(res.body).toHaveProperty('tags')
      expect(res.body.tags).toContain('secure')
      expect(res.body.tags).toContain('important')
      expect(res.body).toHaveProperty('has_password')
      expect(res.body.has_password).toBe(true)
    })

    it('should retrieve combined tags and password status in file list', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      const uploadRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify(['combined-list', 'testing']))
        .field('filePassword', 'combinedList123')
        .attach('file', pdfBuffer, 'combined-list.pdf')
        .expect(201)

      const fileId = uploadRes.body.id

      const listRes = await request(app.getHttpServer())
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const file = listRes.body.find((f: any) => f.id === fileId)
      expect(file).toBeDefined()
      expect(file.tags).toContain('combined-list')
      expect(file.tags).toContain('testing')
      expect(file.has_password).toBe(true)
    })
  })
})

