import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { JwtGuard } from './guards/jwt.guard'

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get('JWT_SECRET') || 'your-secret-key-change-in-production'
        const expiresInStr = configService.get('JWT_EXPIRATION') || '3600'
        // Convert to number (JWT expects seconds as number)
        const expiresIn = parseInt(expiresInStr, 10) || 3600
        console.log('🔐 JWT Config loaded:', { secret: secret.substring(0, 10) + '...', expiresIn })
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [JwtGuard],
  exports: [JwtModule, JwtGuard],
})
export class CommonModule {}

