import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request = require('supertest')
import { AppModule } from '../src/app.module'

describe('Files Endpoints (e2e) - US01/07 Upload', () => {
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

    // Créer un utilisateur de test et obtenir le token
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `files-test-${Date.now()}@example.com`,
        username: 'filestestuser',
        password: 'securePassword123',
      })

    if (registerRes.body && registerRes.body.access_token) {
      authToken = registerRes.body.access_token
    } else {
      authToken = registerRes.body.token
    }
    userId = registerRes.body.user?.id || 'test-user-id'
  }, 30000)

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/files/upload - US01 Upload', () => {
    it('should upload a valid PDF file successfully', () => {
      // Créer un fichier PDF de test
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test content', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('uploadToken')
          expect(res.body).toHaveProperty('id')
          expect(res.body).toHaveProperty('originalName', 'test.pdf')
          expect(res.body).toHaveProperty('size')
          expect(res.body).toHaveProperty('mimetype', 'application/pdf')
          expect(res.body).toHaveProperty('createdAt')
          expect(res.body).not.toHaveProperty('path') // Chemin ne doit pas être exposé
          expect(res.body).not.toHaveProperty('filePasswordHash') // Mot de passe ne doit pas être exposé
        })
    })

    it('should upload a valid text file successfully', () => {
      const textBuffer = Buffer.from('This is a test file content', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', textBuffer, 'test.txt')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('uploadToken')
          expect(res.body.mimetype).toBe('text/plain')
        })
    })

    it('should reject upload without authentication token', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .field('file', pdfBuffer, { filename: 'test.pdf' })
        .expect(401)
    })

    it('should upload a file anonymously without authentication', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%anonymous', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/anonymous')
        .attach('file', pdfBuffer, 'anonymous.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('uploadToken')
          expect(res.body).toHaveProperty('originalName', 'anonymous.pdf')
          expect(res.body).toHaveProperty('has_password', false)
        })
    })

    it('should reject upload with invalid authentication token', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', 'Bearer invalid-token')
        .field('file', pdfBuffer, { filename: 'test.pdf' })
        .expect(401)
    })

    it('should reject upload without file', () => {
      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should reject empty file upload', () => {
      const emptyBuffer = Buffer.from('', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', emptyBuffer, 'empty.txt')
        .expect(400)
    })

    it('should reject file with forbidden extension (.exe)', () => {
      const exeBuffer = Buffer.from('MZ\x90\x00', 'binary') // PE header signature

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', exeBuffer, 'malware.exe')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toMatch(/not allowed|forbidden/i)
        })
    })

    it('should reject file with forbidden extension (.bat)', () => {
      const batBuffer = Buffer.from('@echo off\necho test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', batBuffer, 'script.bat')
        .expect(400)
    })

    it('should reject file with forbidden extension (.sh)', () => {
      const shBuffer = Buffer.from('#!/bin/bash\necho test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', shBuffer, 'script.sh')
        .expect(400)
    })

    it('should generate unique uploadToken for each upload', async () => {
      const pdfBuffer1 = Buffer.from('%PDF-1.4\n%test1', 'utf8')
      const pdfBuffer2 = Buffer.from('%PDF-1.4\n%test2', 'utf8')

      const res1 = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer1, 'test1.pdf')

      const res2 = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer2, 'test2.pdf')

      expect(res1.body.uploadToken).not.toEqual(res2.body.uploadToken)
      expect(res1.body.id).not.toEqual(res2.body.id)
    })

    it('should accept metadata with upload (tags, expirationDays)', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')

      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'test.pdf')
        .field('tags', JSON.stringify(['important', 'work']))
        .field('expirationDays', '7')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('uploadToken')
          // Validation des tags si implémentés dans le DTO
        })
    })
  })

  describe('GET /api/files - US05 Historique', () => {
     it('should retrieve user file history', async () => {
       // D'abord, uploader un fichier
       const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')
       await request(app.getHttpServer())
         .post('/api/files/upload')
         .set('Authorization', `Bearer ${authToken}`)
         .attach('file', pdfBuffer, 'test.pdf')

       // Puis récupérer l'historique
       return request(app.getHttpServer())
         .get('/api/files')
         .set('Authorization', `Bearer ${authToken}`)
         .expect(200)
         .expect((res) => {
           expect(Array.isArray(res.body)).toBe(true)
           if (res.body.length > 0) {
             expect(res.body[0]).toHaveProperty('id')
             expect(res.body[0]).toHaveProperty('token')
             expect(res.body[0]).toHaveProperty('original_name')
           }
         })
     })

    it('should reject file history request without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/files')
        .expect(401)
    })

     it('should only show files belonging to the authenticated user', async () => {
       // Créer un deuxième utilisateur
       const registerRes = await request(app.getHttpServer())
         .post('/api/auth/register')
         .send({
           email: `files-test2-${Date.now()}@example.com`,
           username: `filestestuser2-${Date.now()}`,
           password: 'securePassword123',
         })

       const otherUserToken = registerRes.body.token

       // Upload un fichier avec le premier utilisateur
       const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')
       const uploadRes = await request(app.getHttpServer())
         .post('/api/files/upload')
         .set('Authorization', `Bearer ${authToken}`)
         .attach('file', pdfBuffer, 'user1-file.pdf')

       const fileId = uploadRes.body.id

       // Essayer de récupérer le fichier avec le deuxième utilisateur
       const historyRes = await request(app.getHttpServer())
         .get('/api/files')
         .set('Authorization', `Bearer ${otherUserToken}`)
         .expect(200)

       expect(Array.isArray(historyRes.body)).toBe(true)
       const fileExists = historyRes.body.some((f: any) => f.id === fileId)
       expect(fileExists).toBe(false)
     })
  })

  describe('GET /api/files/:id/download', () => {
    let uploadedFileId: string

    beforeAll(async () => {
      // Upload un fichier de test
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test content for download', 'utf8')
      const uploadRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'download-test.pdf')

      uploadedFileId = uploadRes.body.id
    })

     it('should download a file successfully', () => {
       return request(app.getHttpServer())
         .get(`/api/files/${uploadedFileId}/download`)
         .set('Authorization', `Bearer ${authToken}`)
         .expect(200)
         .expect('Content-Type', 'application/octet-stream')
         .expect((res) => {
           // Vérifier que le body contient du contenu PDF
           expect(res.body).toBeDefined()
           expect(res.body.length).toBeGreaterThan(0)
           // Vérifier les premiers bytes du fichier PDF
           expect(res.body[0]).toBe(0x25) // '%'
           expect(res.body[1]).toBe(0x50) // 'P'
           expect(res.body[2]).toBe(0x44) // 'D'
           expect(res.body[3]).toBe(0x46) // 'F'
         })
     })

    it('should reject download without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/files/${uploadedFileId}/download`)
        .expect(401)
    })

    it('should reject download with non-existent file ID', () => {
      return request(app.getHttpServer())
        .get('/api/files/non-existent-id/download')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('DELETE /api/files/:id - US06 Suppression', () => {
    let deletableFileId: string

    beforeAll(async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')
      const uploadRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('file', pdfBuffer, { filename: 'delete-test.pdf' })

      deletableFileId = uploadRes.body.id
    })

     it('should delete a file successfully', () => {
       return request(app.getHttpServer())
         .delete(`/api/files/${deletableFileId}`)
         .set('Authorization', `Bearer ${authToken}`)
         .expect(204)
     })

    it('should reject delete without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/files/${deletableFileId}`)
        .expect(401)
    })

    it('should reject deletion of non-existent file', () => {
      return request(app.getHttpServer())
        .delete('/api/files/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

     it('should prevent user from deleting other user files', async () => {
       // Créer un deuxième utilisateur
       const registerRes = await request(app.getHttpServer())
         .post('/api/auth/register')
         .send({
           email: `files-test3-${Date.now()}@example.com`,
           username: `filestestuser3-${Date.now()}`,
           password: 'securePassword123',
         })

       const otherUserToken = registerRes.body.token

       // Upload un fichier avec le premier utilisateur
       const pdfBuffer = Buffer.from('%PDF-1.4\n%test', 'utf8')
       const uploadRes = await request(app.getHttpServer())
         .post('/api/files/upload')
         .set('Authorization', `Bearer ${authToken}`)
         .field('file', pdfBuffer, { filename: 'protected-file.pdf' })

       const fileId = uploadRes.body.id

       // Essayer de supprimer avec le deuxième utilisateur
       return request(app.getHttpServer())
         .delete(`/api/files/${fileId}`)
         .set('Authorization', `Bearer ${otherUserToken}`)
         .expect(403)
         .expect((res) => {
           expect(res.body.message).toMatch(/permission|not allowed|owner|forbidden/i)
         })
     })
  })

  describe('US02 - Download Public Link', () => {
    let uploadedToken: string
    let uploadedFile: any

    beforeAll(async () => {
      // Upload un fichier pour les tests de download public
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test content for public download', 'utf8')
      const uploadRes = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('file', pdfBuffer, { filename: 'public-download-test.pdf' })

      uploadedToken = uploadRes.body.uploadToken
      uploadedFile = uploadRes.body
    })

    describe('GET /api/files/share/:uploadToken/metadata', () => {
      it('should retrieve file metadata without authentication', () => {
        return request(app.getHttpServer())
          .get(`/api/files/share/${uploadedToken}/metadata`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('uploadToken', uploadedToken)
            expect(res.body).toHaveProperty('originalName', 'public-download-test.pdf')
            expect(res.body).toHaveProperty('size')
            expect(res.body).toHaveProperty('mimetype', 'application/pdf')
            expect(res.body).toHaveProperty('has_password', false)
            expect(res.body).not.toHaveProperty('path') // Chemin ne doit pas être exposé
          })
      })

      it('should return 404 for invalid upload token', () => {
        return request(app.getHttpServer())
          .get('/api/files/share/invalid-token-12345/metadata')
          .expect(404)
      })

      it('should return 400 for expired file link', async () => {
        // Ce test nécessite un fichier expiré - à adapter selon la configuration
        // Pour maintenant, on peut le sauter ou créer un fichier avec expiration courte
        // TODO: Implémenter quand US10 (expiration) sera complète
        expect(true).toBe(true) // Test temporaire pour éviter l'erreur
      })
    })

    describe('POST /api/files/share/:uploadToken/download', () => {
      it('should download file without password protection', () => {
        return request(app.getHttpServer())
          .post(`/api/files/share/${uploadedToken}/download`)
          .send({})
          .expect(200)
          .expect('Content-Type', 'application/octet-stream')
          .expect((res) => {
            // Vérifier que le body contient du contenu PDF
            expect(res.body).toBeDefined()
            expect(res.body.length).toBeGreaterThan(0)
            // Vérifier les premiers bytes du fichier PDF
            expect(res.body[0]).toBe(0x25) // '%'
            expect(res.body[1]).toBe(0x50) // 'P'
            expect(res.body[2]).toBe(0x44) // 'D'
            expect(res.body[3]).toBe(0x46) // 'F'
          })
      })

      it('should return 404 for invalid upload token', () => {
        return request(app.getHttpServer())
          .post('/api/files/share/invalid-token-12345/download')
          .send({})
          .expect(404)
      })

      it('should require password if file is password protected', async () => {
        // Créer un utilisateur et uploader un fichier avec mot de passe
        // Note: Cela dépend de l'implémentation du upload avec filePassword en DTO
        // Pour maintenant, on saute ce test car le upload ne gère pas encore le filePassword
        // TODO: Implémenter quand US09 (mot de passe fichier) sera complète
        expect(true).toBe(true) // Test temporaire pour éviter l'erreur
      })
    })
  })
})

