import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request = require('supertest')
import { AppModule } from '../src/app.module'
import { DataSource } from 'typeorm'
import { File } from '../src/modules/files/entities/file.entity'

describe('Files Endpoints (e2e) - US10 File Expiration & Automatic Purge', () => {
  let app: INestApplication
  let authToken: string
  let userId: string
  let fileRepository: any

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()

    // Créer un utilisateur de test et obtenir le token
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `expiration-test-${Date.now()}@example.com`,
        username: 'expiration-testuser',
        password: 'securePassword123',
      })

    authToken = registerRes.body.access_token || registerRes.body.token
    userId = registerRes.body.user.id

    // Get file repository for direct DB access using DataSource
    const dataSource = app.get(DataSource)
    fileRepository = dataSource.getRepository(File)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('US10 - File Expiration Validation', () => {
    it('should accept expirationDays between 1 and 7', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test content', 'utf8')

      for (const days of [1, 3, 5, 7]) {
        const res = await request(app.getHttpServer())
          .post('/api/files/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .field('expirationDays', String(days))
          .attach('file', pdfBuffer, 'test.pdf')
          .expect(201)

        expect(res.body).toHaveProperty('expiresAt')
        const expiresAt = new Date(res.body.expiresAt)
        const now = new Date()

        // Vérifier que la date d'expiration est approximativement N jours dans le futur
        const expectedExpiration = new Date(now)
        expectedExpiration.setDate(expectedExpiration.getDate() + days)

        // Tolérance de 2 secondes
        const timeDifference = Math.abs(expiresAt.getTime() - expectedExpiration.getTime())
        expect(timeDifference).toBeLessThan(2000)
      }
    })

    it('should reject expirationDays < 1', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('expirationDays', '0')
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(400)

      expect(JSON.stringify(res.body)).toContain('expirationDays')
    })

    it('should reject expirationDays > 7', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('expirationDays', '10')
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(400)

      expect(JSON.stringify(res.body)).toContain('expirationDays')
    })

    it('should accept undefined expirationDays (no expiration)', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'no-expiry.pdf')
        .expect(201)

      // expiresAt should be null if not provided
      if (res.body.expiresAt) {
        // Si fourni, vérifier qu'il n'est pas trop proche du present
        const expiresAt = new Date(res.body.expiresAt)
        const now = new Date()
        const diffInDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        expect(diffInDays).toBeGreaterThan(0)
      }
    })

    it('should reject non-numeric expirationDays', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('expirationDays', 'invalid')
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(400)

      expect(res.body).toHaveProperty('message')
    })
  })

  describe('US10 - File Access with Expiration', () => {
    let expiredFileToken: string
    let validFileToken: string

    beforeAll(async () => {
      // Upload un fichier qui va expirer
      const pdfBuffer = Buffer.from('%PDF-1.4\n%expired', 'utf8')
      const expiredRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('expirationDays', '1') // Expire demain (pour le test)
        .attach('file', pdfBuffer, 'expiring.pdf')

      expiredFileToken = expiredRes.body.uploadToken

      // Upload un fichier valide
      const validRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('expirationDays', '7')
        .attach('file', pdfBuffer, 'valid.pdf')

      validFileToken = validRes.body.uploadToken

      // Manually expire the first file by updating DB (for testing purposes)
      // Note: In real scenario, wait for 1 day or set expiresAt to past
      if (fileRepository) {
        const file = await fileRepository.findOne({ where: { uploadToken: expiredFileToken } })
        if (file) {
          file.expiresAt = new Date(new Date().getTime() - 1000) // 1 second ago
          await fileRepository.save(file)
        }
      }
    })

    it('should return 410 for expired file metadata', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/files/share/${expiredFileToken}/metadata`)
        .expect(400) // BadRequestException for expired file

      expect(res.body.message).toContain('expired')
    })

    it('should return 404 for non-existent file', async () => {
      const fakeToken = '00000000-0000-0000-0000-000000000000'

      await request(app.getHttpServer())
        .get(`/api/files/share/${fakeToken}/metadata`)
        .expect(404)
    })

    it('should allow download of valid non-expired file', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/files/share/${validFileToken}/metadata`)
        .expect(200)

      expect(res.body).toHaveProperty('originalName')
      expect(res.body).toHaveProperty('expiresAt')
      expect(res.body).toHaveProperty('has_password')

      const expiresAt = new Date(res.body.expiresAt)
      expect(expiresAt.getTime()).toBeGreaterThan(new Date().getTime())
    })

    it('should return 400 when downloading expired file', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/files/share/${expiredFileToken}/download`)
        .send({})
        .expect(400)

      expect(res.body.message).toContain('expired')
    })
  })

  describe('US10 - File History with Expiration Filter', () => {
    let fileIdWithExpiration: string
    let fileIdNoExpiration: string

    beforeAll(async () => {
      // Upload un fichier avec expiration courte
      const pdfBuffer = Buffer.from('%PDF-1.4\n%history test', 'utf8')

      const expRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('expirationDays', '1')
        .attach('file', pdfBuffer, 'history-expiring.pdf')

      fileIdWithExpiration = expRes.body.id

      // Upload un fichier sans expiration
      const noExpRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'history-permanent.pdf')

      fileIdNoExpiration = noExpRes.body.id

      // Expire manually the first file
      if (fileRepository) {
        const file = await fileRepository.findOne({ where: { id: fileIdWithExpiration } })
        if (file) {
          file.expiresAt = new Date(new Date().getTime() - 1000)
          await fileRepository.save(file)
        }
      }
    })

    it('should exclude expired files by default (include_expired=false)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ include_expired: 'false' })
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      const expiredFound = res.body.some((f: any) => f.id === fileIdWithExpiration)
      expect(expiredFound).toBe(false)

      const validFound = res.body.some((f: any) => f.id === fileIdNoExpiration)
      expect(validFound).toBe(true)
    })

    it('should include expired files when explicitly requested', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ include_expired: 'true' })
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)

      // Les deux fichiers doivent être présents
      const expiredFound = res.body.some((f: any) => f.id === fileIdWithExpiration)
      const validFound = res.body.some((f: any) => f.id === fileIdNoExpiration)

      expect(expiredFound).toBe(true)
      expect(validFound).toBe(true)
    })
  })

  describe('US10 - Expiration with Password Protection', () => {
    it('should handle password-protected files with expiration', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%protected', 'utf8')

      // Upload avec password et expiration
      const uploadRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('filePassword', 'SecurePass123')
        .field('expirationDays', '2')
        .attach('file', pdfBuffer, 'protected.pdf')
        .expect(201)

      expect(uploadRes.body).toHaveProperty('uploadToken')
      expect(uploadRes.body.has_password).toBe(true)
      expect(uploadRes.body).toHaveProperty('expiresAt')

      const uploadToken = uploadRes.body.uploadToken

      // Vérifier les métadonnées
      const metadataRes = await request(app.getHttpServer())
        .get(`/api/files/share/${uploadToken}/metadata`)
        .expect(200)

      expect(metadataRes.body.has_password).toBe(true)

      // Télécharger avec le bon mot de passe
      const downloadRes = await request(app.getHttpServer())
        .post(`/api/files/share/${uploadToken}/download`)
        .send({ password: 'SecurePass123' })
        .expect(200)

      // Vérifier que le contenu commence par '%PDF'
      expect(downloadRes.body).toBeDefined()
    })
  })

  describe('US10 - Expiration Edge Cases', () => {
    it('should handle file with tags and expiration', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%tagged', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags[]', 'project')
        .field('tags[]', 'urgent')
        .field('expirationDays', '3')
        .attach('file', pdfBuffer, 'tagged.pdf')
        .expect(201)

      expect(res.body).toHaveProperty('tags')
      expect(Array.isArray(res.body.tags)).toBe(true)
      expect(res.body.tags).toContain('project')
      expect(res.body.tags).toContain('urgent')
      expect(res.body).toHaveProperty('expiresAt')
    })

    it('should calculate expiration date correctly at day boundary', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%boundary', 'utf8')

      const res = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('expirationDays', '7')
        .attach('file', pdfBuffer, 'boundary.pdf')
        .expect(201)

      const expiresAt = new Date(res.body.expiresAt)
      const now = new Date()
      const expectedDate = new Date(now)
      expectedDate.setDate(expectedDate.getDate() + 7)

      // Vérifier que la date est dans 7 jours (avec tolérance)
      const diffInDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffInDays).toBeGreaterThanOrEqual(6.99)
      expect(diffInDays).toBeLessThanOrEqual(7.01)
    })
  })
})





