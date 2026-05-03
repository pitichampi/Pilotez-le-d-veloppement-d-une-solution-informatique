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
  Query,
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
import { FileListItemDto } from './dto/file-list-item.dto'

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
 * Contrôleur de gestion des fichiers (FilesController)
 * Gère tous les endpoints liés aux fichiers :
 * - Upload (US01/07)
 * - Téléchargement public (US02) via lien
 * - Historique (US05)
 * - Suppression (US06)
 *
 * Architecture :
 * - Les fichiers sont stockés sur le système de fichiers local
 * - Chaque fichier a un uploadToken UUID unique pour l'accès public
 * - Les uploads sont protégés par JWT (@UseGuards(JwtGuard))
 * - Les téléchargements publics ne nécessitent pas d'authentification
 */
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Upload d'un fichier (US01)
   * Endpoint protégé réservé aux utilisateurs authentifiés
   *
   * POST /api/files/upload
   * Content-Type: multipart/form-data
   *
   * Champs du formulaire :
   * - file (requis) : Fichier binaire, max 1 Go, types interdits : .exe, .bat, .sh, .msi, .cmd, .ps1
   * - expirationDays (optionnel) : 1-7 jours (défaut 7)
   * - password (optionnel) : Min 6 caractères pour protéger le fichier
   * - tags (optionnel) : Tableau de tags, max 30 chars par tag
   *
   * Processus :
   * 1. Validation du fichier (taille, extension, MIME type)
   * 2. Génération d'un uploadToken UUID unique
   * 3. Stockage du fichier en /uploads/{userId}/{uploadToken}
   * 4. Création de la métadonnée en base de données
   * 5. Retour du token et de l'URL de téléchargement
   *
   * @param file Fichier uploadé par Multer (stocké en mémoire puis écrit sur disque)
   * @param req Request Express avec l'utilisateur authentifié (req.user.sub = userId)
   * @returns UploadResponseDto { id, uploadToken, downloadUrl, originalName, size, mimetype, expiresAt, tags }
   * @throws BadRequestException si fichier invalide
   * @throws PayloadTooLargeException si fichier > 1 Go
   */
  @Post('upload')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1 GB max
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

    // Validation du fichier (taille, extension, type MIME)
    this.filesService.validateFile(file)

    return this.filesService.create(file, req.user.sub, undefined)
  }

  /**
   * Récupère l'historique des fichiers de l'utilisateur (US05)
   * Endpoint protégé, retourne uniquement les fichiers de l'utilisateur authentifié
   *
   * GET /api/files
   *
   * Query : include_expired=false (défaut — n'affiche que les fichiers valides)
   *
   * Réponse : Tableau de FileListItem trié par created_at DESC
   *
   * @param includeExpired Inclure les fichiers expirés
   * @param req Request Express avec l'utilisateur authentifié
   * @returns Tableau de fichiers de l'utilisateur
   */
  @Get()
  @UseGuards(JwtGuard)
  async findAll(
    @Query('include_expired') includeExpired: string = 'false',
    @Req() req: any,
  ): Promise<FileListItemDto[]> {
    const includeExpiredBool = includeExpired === 'true'
    return this.filesService.findAll(req.user.sub, includeExpiredBool)
  }

  /**
   * Récupère les métadonnées d'un fichier avant téléchargement (US02)
   * Endpoint PUBLIC - Pas d'authentification requise
   * Accessible via lien de partage : /api/files/share/{uploadToken}/metadata
   *
   * Les métadonnées permettent au client de :
   * - Afficher le nom et la taille du fichier
   * - Savoir si le fichier est expiré
   * - Savoir si le fichier est protégé par mot de passe
   *
   * @param uploadToken Token d'accès unique du fichier (validé par ParseUuidPipe)
   * @returns DownloadMetadataDto { originalName, size, mimetype, createdAt, expiresAt, isPasswordProtected }
   * @throws NotFoundException si le fichier n'existe pas
   * @throws BadRequestException si le fichier a expiré
   */
  @Get('share/:uploadToken/metadata')
  async getDownloadMetadata(@Param('uploadToken', new ParseUuidPipe()) uploadToken: string): Promise<DownloadMetadataDto> {
    return this.filesService.getDownloadMetadata(uploadToken)
  }

  /**
   * Télécharge un fichier via lien public (US02)
   * Endpoint PUBLIC - Pas d'authentification requise
   * Méthode POST pour sécuriser le mot de passe (ne passe pas en URL)
   *
   * POST /api/files/share/{uploadToken}/download
   *
   * Body (si fichier protégé par mot de passe) :
   * { "password": "motdepasse" }
   *
   * Réponse : Stream binaire
   * - Content-Type: application/octet-stream
   * - Content-Disposition: attachment; filename="...pdf"
   *
   * Processus :
   * 1. Vérifier que le fichier existe
   * 2. Vérifier que le fichier n'a pas expiré
   * 3. Si protégé, valider le mot de passe (bcrypt compare)
   * 4. Charger le fichier du disque
   * 5. Envoyer le contenu binaire au client
   *
   * @param uploadToken Token d'accès unique du fichier
   * @param downloadFileDto { password? } pour fichiers protégés
   * @param res Response Express pour envoyer le flux binaire
   * @returns Stream binaire du fichier
   * @throws NotFoundException si fichier inexistant
   * @throws BadRequestException si fichier expiré ou mot de passe incorrect
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
   * Télécharge un fichier (propriétaire authentifié uniquement)
   * Endpoint protégé pour que le propriétaire télécharge rapidement son fichier
   *
   * GET /api/files/{id}/download
   *
   * @param id UUID du fichier (validé par ParseUuidPipe)
   * @param res Response Express pour envoyer le flux binaire
   * @returns Stream binaire du fichier
   * @throws NotFoundException si fichier inexistant
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
   * Supprime un fichier (propriétaire uniquement - US06)
   * Endpoint protégé, suppression vérifiée par propriété
   *
   * DELETE /api/files/{id}
   *
   * Processus :
   * 1. Vérifier que l'utilisateur est propriétaire du fichier
   * 2. Supprimer le fichier du disque
   * 3. Supprimer la métadonnée de la base de données
   * 4. Retour 204 No Content
   *
   * @param id UUID du fichier
   * @param req Request Express avec l'utilisateur authentifié
   * @throws NotFoundException si fichier inexistant
   * @throws ForbiddenException si utilisateur n'est pas propriétaire
   */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtGuard)
  async remove(@Param('id', new ParseUuidPipe()) id: string, @Req() req: any): Promise<void> {
    await this.filesService.remove(id, req.user.sub)
  }
}
