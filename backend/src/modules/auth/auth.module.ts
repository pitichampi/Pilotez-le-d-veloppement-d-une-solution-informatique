import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { CommonModule } from '@common/common.module'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { UsersModule } from '@modules/users/users.module'

/**
 * Module d'authentification (AuthModule)
 * Centralise la logique d'enregistrement, connexion et validation JWT
 *
 * Composants :
 * - AuthService : Logique d'authentification (register, login, validateToken)
 * - AuthController : Endpoints (POST /register, POST /login, GET /me)
 * - JwtStrategy : Stratégie Passport pour valider les JWTs
 *
 * Dépendances :
 * - PassportModule : Support Passport pour JWT
 * - CommonModule : Configuration globale (JwtService)
 * - UsersModule : Accès au service UsersService
 *
 * Exports :
 * - AuthService : Utilisé par d'autres modules si besoin
 * - CommonModule : JwtService exporté globalement
 *
 * Flow d'authentification :
 * 1. User POST /auth/register → AuthService.register()
 * 2. Email unique vérifié, password hashé avec bcrypt(cost=10)
 * 3. JWT généré avec JwtService.sign({ sub: userId, email })
 * 4. Token retourné au client
 * 5. Client utilise token : Authorization: Bearer {token}
 * 6. JwtGuard valide token avec JwtStrategy
 */
@Module({
  imports: [PassportModule, CommonModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, CommonModule],
})
export class AuthModule {}

