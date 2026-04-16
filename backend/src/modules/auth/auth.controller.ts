import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto'
import { JwtGuard } from '@common/guards/jwt.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto)
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto)
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@Req() req: any) {
    return {
      id: req.user.sub,
      email: req.user.email,
    }
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' }
  }
}

