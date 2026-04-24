import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { CommonModule } from '@common/common.module'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { UsersModule } from '@modules/users/users.module'

@Module({
  imports: [PassportModule, CommonModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, CommonModule],
})
export class AuthModule {}

