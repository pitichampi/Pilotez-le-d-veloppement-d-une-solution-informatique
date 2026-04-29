import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

/**
 * Point d'entrée de l'application NestJS
 * Lance le serveur sur le port 3001 (ou celui défini en variable d'environnement)
 * Configure :
 * - Le préfixe global d'API "/api"
 * - La validation globale avec class-validator (whitelist + transformation)
 * - CORS pour communiquer avec le frontend React sur localhost:3000
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  /**
   * Préfixe global pour tous les endpoints : /api
   * Toutes les routes sont préfixées par "/api" (ex: /api/files, /api/auth)
   */
  app.setGlobalPrefix('api')

  /**
   * Pipeline de validation globale
   * - transform: true → Convertit automatiquement les types (string → number, etc.)
   * - whitelist: true → Rejette les propriétés non validées du DTO
   * Applique ValidationPipe sur tous les endpoints POST/PUT/PATCH
   */
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

  /**
   * Configuration CORS (Cross-Origin Resource Sharing)
   * Autorise les requêtes du frontend (localhost:3000) à accéder à l'API
   * credentials: true → Autorise les cookies et headers d'authentification
   */
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  const port = process.env.API_PORT || 3001
  await app.listen(port)
  console.log(`✅ Backend running on http://localhost:${port}`)
}

bootstrap()

