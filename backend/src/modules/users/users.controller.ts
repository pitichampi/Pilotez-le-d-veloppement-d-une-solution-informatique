import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto'
import { JwtGuard } from '@common/guards/jwt.guard'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtGuard)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll()
    return users.map((user) => this.usersService.toResponseDto(user))
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id)
    return this.usersService.toResponseDto(user)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: Partial<CreateUserDto>) {
    const user = await this.usersService.update(id, updateUserDto)
    return this.usersService.toResponseDto(user)
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(id)
    return { message: 'User deleted successfully' }
  }
}

