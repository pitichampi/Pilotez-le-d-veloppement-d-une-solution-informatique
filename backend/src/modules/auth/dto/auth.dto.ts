import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string
}

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(3)
  username: string

  @IsString()
  @MinLength(8)
  password: string
}

export class AuthResponseDto {
  token: string
  user: {
    id: string
    email: string
    username: string
    createdAt: Date
  }
}

