import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthService } from '@modules/auth/auth.service'

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    try {
      const payload = await this.authService.validateToken(token)
      request.user = payload
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }
}

