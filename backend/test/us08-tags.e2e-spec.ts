import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request = require('supertest')
import { AppModule } from '../src/app.module'

describe('US08 - Tags Management (e2e)', () => {
  let app: INestApplication
  let authToken: string
  let userId: string

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
        email: `tags-test-${Date.now()}@example.com`,
        username: 'tagsuser',
        password: 'securePassword123',
      })

    authToken = registerRes.body.token
    userId = registerRes.body.user.id
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/files/upload - US08 Tags', () => {
    it('should upload file without tags', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test content', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('tags')
          expect(res.body.tags).toEqual([])
        })
    })

    it('should upload file with single tag', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify(['important']))
        .attach('file', pdfBuffer, 'single-tag.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('tags')
          expect(res.body.tags).toContain('important')
          expect(res.body.tags.length).toBe(1)
        })
    })

    it('should upload file with multiple tags', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify(['project', 'confidential', '2025-Q1']))
        .attach('file', pdfBuffer, 'multi-tags.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('tags')
          expect(res.body.tags).toHaveLength(3)
          expect(res.body.tags).toContain('project')
          expect(res.body.tags).toContain('confidential')
          expect(res.body.tags).toContain('2025-Q1')
        })
    })

    it('should reject tags exceeding 30 characters', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')
      const longTag = 'a'.repeat(31) // 31 caractères

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify([longTag]))
        .attach('file', pdfBuffer, 'long-tag.pdf')
        .expect(400)
    })

    it('should accept tags with exactly 30 characters', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')
      const maxTag = 'a'.repeat(30) // 30 caractères exactement

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify([maxTag]))
        .attach('file', pdfBuffer, 'max-tag.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body.tags).toContain(maxTag)
        })
    })

    it('should deduplicate tags automatically', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify(['important', 'work', 'important']))
        .attach('file', pdfBuffer, 'dup-tags.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body.tags).toHaveLength(2)
          expect(res.body.tags).toContain('important')
          expect(res.body.tags).toContain('work')
        })
    })

    it('should retrieve tags in file list', async () => {
      // Upload file with tags
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')
      const uploadRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify(['retrieve', 'test']))
        .attach('file', pdfBuffer, 'retrieve-tags.pdf')
        .expect(201)

      const uploadedFileId = uploadRes.body.id

      // Retrieve file list
      return request(app.getHttpServer())
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const file = res.body.find((f: any) => f.id === uploadedFileId)
          expect(file).toBeDefined()
          expect(file.tags).toContain('retrieve')
          expect(file.tags).toContain('test')
        })
    })

    it('should accept empty tags array', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', JSON.stringify([]))
        .attach('file', pdfBuffer, 'empty-tags.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body.tags).toEqual([])
        })
    })
  })
})

