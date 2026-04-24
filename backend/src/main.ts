import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Set global API prefix
  app.setGlobalPrefix('api')

  // Global pipes for validation
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  const port = process.env.API_PORT || 3001
  await app.listen(port)
  console.log(`✅ Backend running on http://localhost:${port}`)
}

bootstrap()

