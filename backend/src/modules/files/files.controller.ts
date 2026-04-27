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
import { diskStorage } from 'multer'
import { FilesService } from './files.service'
import { JwtGuard } from '@common/guards/jwt.guard'
import { UploadResponseDto } from './dto/upload-response.dto'
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

/**
 * Contrôleur pour la gestion des fichiers
 * US01/07: Upload, download, historique, suppression
 */
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Endpoint d'upload de fichier
   * US01: Upload avec token UUID unique, limite 1 Go, validation sécurité
   * POST /api/files/upload
   * @param file Fichier uploadé
   * @param req Request avec user JWT
   * @param createFileDto Métadonnées optionnelles
   * @returns UploadResponseDto avec uploadToken
   */
  @Post('upload')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: '/tmp/uploads', // Destination temporaire avant traitement
        filename: (req, file, cb) => {
          // Générer un nom temporaire unique
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
          cb(null, `${uniqueSuffix}-${file.originalname}`)
        },
      }),
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1 GB
      },
    }),
  )
  async upload(
    @UploadedFile() file: MulterFile,
    @Req() req: Request & { user: any },
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    // Validation du fichier
    this.filesService.validateFile(file)

    return this.filesService.create(file, req.user.sub, undefined)
  }

  /**
   * Récupère l'historique des fichiers de l'utilisateur
   * US05: Historique des fichiers uploadés
   * GET /api/files
   * @param req Request avec user JWT
   * @returns Liste des fichiers
   */
  @Get()
  @UseGuards(JwtGuard)
  async findAll(@Req() req: any) {
    return this.filesService.findAll(req.user.sub)
  }

  /**
   * Télécharge un fichier
   * US02: Download avec POST pour sécurisation du mot de passe (implémenté en US02)
   * GET /api/files/:id/download
   * @param id ID du fichier
   * @returns StreamableFile pour le téléchargement
   */
  @Get(':id/download')
  @UseGuards(JwtGuard)
  async download(@Param('id') id: string) {
    const buffer = await this.filesService.getFileBuffer(id)
    const file = await this.filesService.findOne(id)

    return new StreamableFile(buffer, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="${file.originalName}"`,
    })
  }

  /**
   * Supprime un fichier
   * US06: Suppression avec vérification de propriété
   * DELETE /api/files/:id
   * @param id ID du fichier
   * @param req Request avec user JWT
   */
  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.filesService.remove(id, req.user.sub)
    return { message: 'File deleted successfully' }
  }
}

