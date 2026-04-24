import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { FilesService } from './files.service'
import { JwtGuard } from '@common/guards/jwt.guard'
import type { Request } from 'express'

interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer: Buffer
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

   @Post('upload')
   @UseGuards(JwtGuard)
   @UseInterceptors(FileInterceptor('file'))
   async upload(@UploadedFile() file: MulterFile, @Req() req: Request & { user: any }) {
     if (!file) {
       throw new BadRequestException('No file uploaded')
     }
     return this.filesService.create(file, req.user.sub)
   }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(@Req() req: any) {
    return this.filesService.findAll(req.user.sub)
  }

  @Get(':id/download')
  @UseGuards(JwtGuard)
  async download(@Param('id') id: string) {
    const { stream, filename } = await this.filesService.getFileStream(id)
    return new StreamableFile(stream, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="${filename}"`,
    })
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(@Param('id') id: string) {
    await this.filesService.remove(id)
    return { message: 'File deleted successfully' }
  }
}

