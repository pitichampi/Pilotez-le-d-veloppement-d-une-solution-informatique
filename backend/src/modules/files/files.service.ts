import { Injectable, Logger, BadRequestException, NotFoundException, PayloadTooLargeException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { File } from './entities/file.entity'
import { CreateFileDto } from './dto/upload.dto'
import { UploadResponseDto } from './dto/upload-response.dto'
import { LocalStorageService } from './storage/local-storage.service'

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
 * Service de gestion des fichiers
 * Gère l'upload, le stockage, la récupération et la suppression des fichiers
 * US01/07: Upload avec token UUID unique et limite 1 Go
 */
@Injectable()
export class FilesService {
  private readonly logger = new Logger('FilesService')

  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private storageService: LocalStorageService,
  ) {}

  /**
   * Crée et sauvegarde un fichier uploadé
   * US01: Génération d'un token UUID unique pour chaque upload
   * @param fileData Fichier uploadé par Multer
   * @param userId ID de l'utilisateur propriétaire
   * @param createFileDto Métadonnées optionnelles (tags, password, expiration)
   * @returns UploadResponseDto avec les métadonnées et le token
   */
  async create(
    fileData: MulterFile,
    userId: string,
    createFileDto?: CreateFileDto,
  ): Promise<UploadResponseDto> {
    if (!fileData) {
      throw new BadRequestException('No file uploaded')
    }

    // Générer un token UUID unique pour le fichier
    const uploadToken = randomUUID()

    // Créer un chemin de stockage structuré: /uploads/{userId}/{uploadToken}-{originalname}
    const filename = `${uploadToken}-${fileData.originalname}`
    const filepath = `${userId}/${filename}`

    try {
      // Sauvegarder le fichier dans le stockage
      const savedPath = await this.storageService.saveFile(fileData.buffer, filepath)

      // Créer l'entité fichier
      const file = this.filesRepository.create({
        uploadToken,
        name: filename,
        originalName: fileData.originalname,
        mimetype: fileData.mimetype,
        size: fileData.size,
        path: savedPath,
        storageType: 'local',
        userId,
        tags: createFileDto?.tags ? JSON.stringify(createFileDto.tags) : null,
        filePasswordHash: null, // À implémenter avec Bcrypt en US09
        expiresAt: this.calculateExpirationDate(createFileDto?.expirationDays),
      })

      const savedFile = await this.filesRepository.save(file)

      this.logger.log(`File uploaded successfully: ${uploadToken} by user ${userId}`)

      // Retourner un DTO de réponse sans les champs sensibles
      return this.mapToUploadResponseDto(savedFile)
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`)
      throw new BadRequestException(`Failed to save file: ${error.message}`)
    }
  }

  /**
   * Récupère tous les fichiers d'un utilisateur
   * US05: Historique - Accès réservé au propriétaire
   * @param userId ID de l'utilisateur
   * @returns Liste des fichiers de l'utilisateur
   */
  async findAll(userId?: string): Promise<File[]> {
    const query = this.filesRepository.createQueryBuilder('file')
    if (userId) {
      query.where('file.userId = :userId', { userId })
    }
    return query.orderBy('file.createdAt', 'DESC').getMany()
  }

  /**
   * Récupère un fichier par son ID
   * @param id ID du fichier
   * @returns Le fichier ou null
   */
  async findOne(id: string): Promise<File> {
    return this.filesRepository.findOne({ where: { id } })
  }

  /**
   * Récupère un fichier par son uploadToken
   * US01: Accès au fichier via token unique
   * @param uploadToken Token d'accès unique du fichier
   * @returns Le fichier ou null
   */
  async findByUploadToken(uploadToken: string): Promise<File> {
    return this.filesRepository.findOne({ where: { uploadToken } })
  }

  /**
   * Supprime un fichier (du stockage et de la BD)
   * US06: Suppression - Vérifier que l'utilisateur est propriétaire
   * @param id ID du fichier
   * @param userId ID de l'utilisateur (pour vérification de propriété)
   */
  async remove(id: string, userId: string): Promise<void> {
    const file = await this.findOne(id)

    if (!file) {
      throw new NotFoundException('File not found')
    }

    // Vérifier que l'utilisateur est propriétaire du fichier
    if (file.userId !== userId) {
      throw new BadRequestException('You do not have permission to delete this file')
    }

    try {
      // Supprimer du stockage
      await this.storageService.deleteFile(file.path)

      // Supprimer de la BD
      await this.filesRepository.delete(id)

      this.logger.log(`File deleted: ${id}`)
    } catch (error) {
      this.logger.error(`Failed to delete file ${id}: ${error.message}`)
      throw new BadRequestException(`Failed to delete file: ${error.message}`)
    }
  }

  /**
   * Récupère un fichier du stockage pour téléchargement
   * @param id ID du fichier
   * @returns Buffer du fichier
   */
  async getFileBuffer(id: string): Promise<Buffer> {
    const file = await this.findOne(id)

    if (!file) {
      throw new NotFoundException('File not found')
    }

    try {
      return await this.storageService.getFile(file.path)
    } catch (error) {
      this.logger.error(`Failed to retrieve file ${id}: ${error.message}`)
      throw new NotFoundException('File not found in storage')
    }
  }

  /**
   * Valide un fichier uploadé selon les critères de sécurité
   * US01: Validation de taille, extensions et MIME types
   * @param file Fichier uploadé
   * @throws BadRequestException ou PayloadTooLargeException
   */
  validateFile(file: MulterFile): void {
    const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1 GB

    const ALLOWED_MIME_TYPES = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'audio/mpeg',
      'audio/wav',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/json',
      'application/xml',
      'text/xml',
    ])

    const FORBIDDEN_EXTENSIONS = new Set([
      '.exe',
      '.bat',
      '.sh',
      '.msi',
      '.cmd',
      '.ps1',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
      '.com',
    ])

    // Vérification 1: Taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum allowed size of 1 GB. Received: ${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB`,
      )
    }

    if (file.size === 0) {
      throw new BadRequestException('Uploaded file is empty')
    }

    // Vérification 2: Extension du fichier
    const filename = file.originalname.toLowerCase()
    const extension = filename.substring(filename.lastIndexOf('.'))

    if (FORBIDDEN_EXTENSIONS.has(extension)) {
      throw new BadRequestException(`File extension "${extension}" is not allowed for security reasons`)
    }

    // Vérification 3: Type MIME annoncé
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `MIME type "${file.mimetype}" is not allowed`,
      )
    }

    // Vérification 4: Détection du type MIME réel (détection magique)
    this.validateMimeTypeSignature(file)
  }

  /**
   * Valide le type MIME en détectant la signature du fichier
   * @param file Fichier uploadé
   */
  private validateMimeTypeSignature(file: MulterFile): void {
    if (!file.buffer || file.buffer.length === 0) {
      return
    }

    const buffer = file.buffer

    // Protection: Rejeter les exécutables PE
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      // MZ header
      throw new BadRequestException('Executable file detected (PE header found)')
    }

    // Protection: Rejeter les scripts
    const headerStr = buffer.toString('utf8', 0, Math.min(10, buffer.length)).toLowerCase()
    if (headerStr.includes('#!/')) {
      throw new BadRequestException('Shell script detected')
    }
  }

  /**
   * Calcule la date d'expiration du fichier
   * US10: 1-7 jours, purge automatique
   * @param expirationDays Nombre de jours (1-7 ou undefined)
   * @returns Date d'expiration ou null si pas d'expiration
   */
  private calculateExpirationDate(expirationDays?: number): Date | null {
    if (!expirationDays) {
      return null
    }

    // Valider la plage 1-7 jours
    if (expirationDays < 1 || expirationDays > 7) {
      this.logger.warn(`Invalid expiration days: ${expirationDays}. Using default 7 days.`)
      expirationDays = 7
    }

    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + expirationDays)
    return expirationDate
  }

  /**
   * Mappe une entité File vers un DTO de réponse
   * @param file Entité File de la base de données
   * @returns UploadResponseDto
   */
  private mapToUploadResponseDto(file: File): UploadResponseDto {
    return {
      id: file.id,
      uploadToken: file.uploadToken,
      name: file.name,
      originalName: file.originalName,
      size: file.size,
      mimetype: file.mimetype,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
      tags: file.tags ? JSON.parse(file.tags) : undefined,
    }
  }
}

