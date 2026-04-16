import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string

  @IsString()
  @MinLength(8)
  password: string
}

export class UserResponseDto {
  id: string
  email: string
  username: string
  role: string
  createdAt: Date
}

