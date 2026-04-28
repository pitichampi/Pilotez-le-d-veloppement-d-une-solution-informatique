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
  Body,
  HttpCode,
  Response,
  Res,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { FilesService } from './files.service'
import { JwtGuard } from '@common/guards/jwt.guard'
import { ParseUuidPipe } from '@common/pipes/parse-uuid.pipe'
import { UploadResponseDto } from './dto/upload-response.dto'
import { DownloadMetadataDto } from './dto/download-metadata.dto'
import { DownloadFileDto } from './dto/download-file.dto'
import type { Request, Response as ExpressResponse } from 'express'

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
      storage: memoryStorage(),
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
   * Récupère les métadonnées d'un fichier pour téléchargement public
   * US02: Les métadonnées du fichier sont visibles avant téléchargement
   * GET /api/files/share/:uploadToken/metadata
   * Accessible sans authentification (via lien publique)
   * @param uploadToken Token d'accès unique du fichier
   * @returns DownloadMetadataDto contenant nom, taille, type, etc.
   */
  @Get('share/:uploadToken/metadata')
  async getDownloadMetadata(@Param('uploadToken', new ParseUuidPipe()) uploadToken: string): Promise<DownloadMetadataDto> {
    return this.filesService.getDownloadMetadata(uploadToken)
  }

  /**
   * Télécharge un fichier via lien public
   * US02: Download - Endpoint POST pour sécurisation du mot de passe
   * POST /api/files/share/:uploadToken/download
   * Accessible sans authentification (via lien publique)
   * @param uploadToken Token d'accès unique du fichier
   * @param downloadFileDto Contient optionnellement le mot de passe
   * @param res Response object pour envoyer le fichier
   * @returns StreamableFile pour télécharger le fichier
   */
  @Post('share/:uploadToken/download')
  @HttpCode(200)
  async downloadFile(
    @Param('uploadToken', new ParseUuidPipe()) uploadToken: string,
    @Body() downloadFileDto: DownloadFileDto,
    @Res() res: ExpressResponse,
  ) {
    const buffer = await this.filesService.downloadFile(uploadToken, downloadFileDto.password)
    const file = await this.filesService.findByUploadToken(uploadToken)

    res.contentType('application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`)
    res.end(buffer)
  }

  /**
   * Télécharge un fichier (endpoint protégé pour les propriétaires)
   * US02: Download - Endpoint pour les propriétaires du fichier
   * GET /api/files/:id/download
   * @param id ID du fichier
   * @param res Response object pour envoyer le fichier
   * @returns StreamableFile pour le téléchargement
   */
  @Get(':id/download')
  @UseGuards(JwtGuard)
  async download(@Param('id', new ParseUuidPipe()) id: string, @Res() res: ExpressResponse) {
    const buffer = await this.filesService.getFileBuffer(id)
    const file = await this.filesService.findOne(id)

    res.contentType('application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`)
    res.end(buffer)
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
  async remove(@Param('id', new ParseUuidPipe()) id: string, @Req() req: any) {
    await this.filesService.remove(id, req.user.sub)
    return { message: 'File deleted successfully' }
  }
}

