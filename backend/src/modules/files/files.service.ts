/**
 * @file files.service.ts
 * @description Service de gestion des fichiers pour DataShare
 *
 * Responsabilités principales :
 * - Upload sécurisé de fichiers (validation MIME, taille, extension)
 * - Stockage physique des fichiers via StorageService abstrait
 * - Gestion métadonnées en base de données (TypeORM)
 * - Téléchargement public via token UUID unique
 * - Gestion des mots de passe (Bcrypt, coût 10)
 * - Gestion de l'expiration des liens (1-7 jours)
 * - Suppression avec vérification de propriété
 *
 * Architecture :
 * - StorageService : abstraction du stockage (local → S3 possible)
 * - Repository TypeORM : ORM pour interagir avec PostgreSQL
 * - Bcrypt : hachage des mots de passe (US09)
 *
 * User Stories couvertes :
 * - US01/07: Upload avec token UUID unique, limite 1 Go
 * - US02: Download public via token avec validation expiration
 * - US05/06: Historique et suppression réservés au propriétaire
 * - US08: Tags (0 à N, sérialisés en JSON)
 * - US09: Mot de passe optionnel hashé Bcrypt
 * - US10: Expiration 1-7 jours, purge automatique
 *
 * Sécurité :
 * - Validation des types MIME (liste blanche)
 * - Détection des signatures de fichiers (magic bytes)
 * - Extensions interdites : .exe, .bat, .sh, .msi, .cmd, .ps1
 * - Hachage Bcrypt (cost 10) pour tous les mots de passe
 * - Vérification d'ownership avant suppression/accès
 *
 * @author DataShare Team
 * @version 1.0.0
 */

import { Injectable, Logger, BadRequestException, NotFoundException, PayloadTooLargeException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import * as bcrypt from 'bcryptjs'
import { File } from './entities/file.entity'
import { CreateFileDto } from './dto/upload.dto'
import { UploadResponseDto } from './dto/upload-response.dto'
import { DownloadMetadataDto } from './dto/download-metadata.dto'
import { LocalStorageService } from './storage/local-storage.service'
import { FileListItemDto } from './dto/file-list-item.dto'

/**
 * Interface représentant un fichier uploadé par Multer
 * Propriétés fournies par le middleware multer lors d'un upload
 *
 * @interface MulterFile
 * @property {string} fieldname - Nom du champ form HTML (ex: "file")
 * @property {string} originalname - Nom original du fichier client
 * @property {string} encoding - Encoding du fichier (ex: "7bit", "binary")
 * @property {string} mimetype - Type MIME détecté (ex: "application/pdf")
 * @property {number} size - Taille en bytes du fichier uploadé
 * @property {string} destination - Dossier de destination du fichier
 * @property {string} filename - Nom du fichier sur le serveur
 * @property {string} path - Chemin complet du fichier stocké
 * @property {Buffer} buffer - Contenu binaire du fichier en mémoire
 */
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
 * Service de gestion des fichiers (Injectable NestJS)
 * Fournit les méthodes de CRUD pour les fichiers
 *
 * Injection de dépendances :
 * - filesRepository: TypeORM Repository pour la table "file"
 * - storageService: Service abstrait de stockage (implementation: LocalStorageService)
 *
 * Tous les fichiers sont sauvegardés en BD et sur le disque
 * Chemin de stockage : /uploads/{userId}/{uploadToken}-{originalname}
 *
 * @example
 * const uploadedFile = await filesService.create(multerFile, userId, { tags: ['important'], expirationDays: 3 })
 * const metadata = await filesService.getDownloadMetadata(uploadToken)
 * const buffer = await filesService.downloadFile(uploadToken, optionalPassword)
 */
@Injectable()
export class FilesService {
  /** Logger NestJS pour tracer les actions importantes */
  private readonly logger = new Logger('FilesService')

  /**
   * Constructeur avec injection de dépendances
   * @param {Repository<File>} filesRepository - Connexion à la table "file" (PostgreSQL)
   * @param {LocalStorageService} storageService - Service de stockage des fichiers
   */
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
    userId?: string,
    createFileDto?: CreateFileDto,
  ): Promise<UploadResponseDto> {
    if (!fileData) {
      throw new BadRequestException('Aucun fichier uploadé')
    }

    // Générer un token UUID unique pour le fichier
    const uploadToken = randomUUID()

    const filename = `${uploadToken}-${fileData.originalname}`
    const storagePrefix = userId ? userId : 'anonymous'
    const filepath = `${storagePrefix}/${filename}`

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
        userId: userId ?? null,
        // Deduplicate tags if present
        tags: createFileDto?.tags ? JSON.stringify(Array.from(new Set(createFileDto.tags))) : null,
        filePasswordHash: null, // À implémenter avec Bcrypt en US09
        expiresAt: this.calculateExpirationDate(createFileDto?.expirationDays),
      })

      const savedFile = await this.filesRepository.save(file)

      this.logger.log(`File uploaded successfully: ${uploadToken} by user ${userId}`)

      // Retourner un DTO de réponse sans les champs sensibles
      return this.mapToUploadResponseDto(savedFile)
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`)
      throw new BadRequestException(`Impossible d'enregistrer le fichier : ${error.message}`)
    }
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
       throw new NotFoundException('Fichier introuvable')
     }

     // Vérifier que l'utilisateur est propriétaire du fichier
     if (file.userId !== userId) {
       throw new ForbiddenException('Vous n\'avez pas la permission de supprimer ce fichier')
     }

    try {
      // Supprimer du stockage
      await this.storageService.deleteFile(file.path)

      // Supprimer de la BD
      await this.filesRepository.delete(id)

      this.logger.log(`File deleted: ${id}`)
    } catch (error) {
      this.logger.error(`Failed to delete file ${id}: ${error.message}`)
      throw new BadRequestException(`Impossible de supprimer le fichier : ${error.message}`)
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
      throw new NotFoundException('Fichier introuvable')
    }

    try {
      return await this.storageService.getFile(file.path)
    } catch (error) {
      this.logger.error(`Failed to retrieve file ${id}: ${error.message}`)
      throw new NotFoundException('Fichier introuvable dans le stockage')
    }
  }

  /**
   * Valide un fichier uploadé selon les critères de sécurité
   * US01: Validation obligatoire pour tous les uploads (authentifié ou anonyme)
   *
   * Valide 4 critères :
   * 1. Taille : max 1 Go
   * 2. Extension : blacklist des exécutables (.exe, .bat, .sh, etc.)
   * 3. Type MIME annoncé : whitelist stricte (PDF, Office, images, audio, video, archives)
   * 4. Signature du fichier : détection magique (PE header, script shell, etc.)
   *
   * @param {MulterFile} file - Fichier uploadé par Multer
   * @throws {PayloadTooLargeException} Si le fichier dépasse 1 Go
   * @throws {BadRequestException} Si extension interdite, fichier vide, ou MIME type invalide
   *
   * @example
   * try {
   *   filesService.validateFile(multerFile)
   * } catch (error) {
   *   if (error instanceof PayloadTooLargeException) {
   *     // Fichier trop gros
   *   }
   * }
   */
  validateFile(file: MulterFile): void {
    const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1 GB

    /**
     * Liste blanche des types MIME autorisés
     * Limitation intentionnelle pour sécurité
     * Couvre : documents, images, vidéos, archives, données
     */
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

    /**
     * Extensions interdites (blacklist)
     * Focus sur les exécutables et scripts dangereux
     * .exe, .bat (Windows), .sh (Linux/Mac), .ps1 (PowerShell), etc.
     */
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
        `La taille du fichier dépasse 1 Go. Reçu : ${(file.size / 1024 / 1024 / 1024).toFixed(2)} Go`,
      )
    }

    if (file.size === 0) {
      throw new BadRequestException('Le fichier uploadé est vide')
    }

    // Vérification 2: Extension du fichier
    const filename = file.originalname.toLowerCase()
    const extension = filename.substring(filename.lastIndexOf('.'))

    if (FORBIDDEN_EXTENSIONS.has(extension)) {
      throw new BadRequestException(`L'extension de fichier « ${extension} » n'est pas autorisée pour des raisons de sécurité`)
    }

    // Vérification 3: Type MIME annoncé
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Type MIME « ${file.mimetype} » non autorisé`,
      )
    }

    // Vérification 4: Détection du type MIME réel (détection magique)
    this.validateMimeTypeSignature(file)
  }

  /**
   * Valide le type MIME en détectant la signature réelle du fichier (magic bytes)
   *
   * Couche de sécurité supplémentaire pour détecter les fichiers mal nommés
   * Exemple : fichier .pdf qui est en réalité un .exe renommé
   *
   * Détections implémentées :
   * - PE header (MZ) : exécutables Windows (.exe, .dll, .msi)
   * - Shell script shebang (#!) : scripts bash, python, perl
   *
   * Pour une sécurité maximale, utiliser la librarie `file-type` en production
   *
   * @param {MulterFile} file - Fichier uploadé avec le buffer accessible
   * @throws {BadRequestException} Si signature dangereuse détectée
   *
   * @private
   * @internal
   */
  private validateMimeTypeSignature(file: MulterFile): void {
    if (!file.buffer || file.buffer.length === 0) {
      return
    }

    const buffer = file.buffer

    /**
     * Détection 1: PE header (Portable Executable)
     * Signature : bytes "MZ" (0x4D 0x5A)
     * Indicateur : fichier exécutable Windows (.exe, .dll, .msi, etc.)
     * Risque : exécution de code malveillant
     */
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      // MZ header
      throw new BadRequestException('Fichier exécutable détecté (en-têtre PE trouvé)')
    }

    /**
     * Détection 2: Script shell shebang
     * Signature : commence par "#!" (0x23 0x21)
     * Exemples : #!/bin/bash, #!/usr/bin/python, etc.
     * Risque : exécution de scripts non détectés
     */
    const headerStr = buffer.toString('utf8', 0, Math.min(10, buffer.length)).toLowerCase()
    if (headerStr.includes('#!/')) {
      throw new BadRequestException('Script shell détecté')
    }
  }

  /**
   * Calcule la date d'expiration du fichier
   * US10: Expiration 1-7 jours, purge automatique via Cron
   *
   * Logique :
   * - Si expirationDays ≠ undefined : calcul une date future + N jours
   * - Si expirationDays < 1 ou > 7 : log warning et utilise 7 jours par défaut
   * - Si expirationDays = undefined/null : retourne null (pas d'expiration)
   *
   * La purge automatique (suppression des fichiers expirés) est gérée par
   * une tâche Cron quotidienne dans FilesModule à minuit UTC
   *
   * @param {number} [expirationDays] - Nombre de jours avant expiration (1-7), undefined = pas d'expiration
   * @returns {Date | null} Date ISO 8601 UTC d'expiration, ou null si pas d'expiration
   *
   * @example
   * const exp1 = calculateExpirationDate(3)     // Date + 3 jours
   * const exp2 = calculateExpirationDate(10)    // Date + 7 jours (log warning)
   * const exp3 = calculateExpirationDate()      // null (pas d'expiration)
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
      download_url: `http://localhost:3000/d/${file.uploadToken}`,
      name: file.name,
      originalName: file.originalName,
      size: file.size,
      mimetype: file.mimetype,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
      has_password: !!file.filePasswordHash,
      tags: file.tags ? JSON.parse(file.tags) : [],
    }
  }

  /**
   * Mappe une entité File vers un DTO pour la liste des fichiers
   * @param file Entité File de la base de données
   * @returns FileListItemDto
   */
  private mapToFileListItemDto(file: File): FileListItemDto {
    return {
      id: file.id,
      token: file.uploadToken,
      download_url: `http://localhost:3000/d/${file.uploadToken}`,
      original_name: file.originalName,
      size_bytes: file.size,
      mime_type: file.mimetype,
      expires_at: file.expiresAt,
      has_password: !!file.filePasswordHash,
      tags: file.tags ? JSON.parse(file.tags) : [],
    }
  }

  /**
   * Récupère les métadonnées d'un fichier par son uploadToken
   * US02: Les métadonnées du fichier sont visibles avant téléchargement
   * @param uploadToken Token d'accès unique du fichier
   * @returns DownloadMetadataDto contenant les métadonnées
   * @throws NotFoundException si le fichier n'existe pas
   * @throws BadRequestException si le fichier a expiré
   */
  async getDownloadMetadata(uploadToken: string): Promise<DownloadMetadataDto> {
    const file = await this.findByUploadToken(uploadToken)

    if (!file) {
      throw new NotFoundException('Fichier introuvable ou lien invalide')
    }

    // Vérifier l'expiration
    if (file.expiresAt && new Date() > file.expiresAt) {
      throw new BadRequestException('Ce lien de fichier a expiré')
    }

    return {
      original_name: file.originalName,
      size_bytes: file.size,
      mime_type: file.mimetype,
      expires_at: file.expiresAt,
      has_password: !!file.filePasswordHash,
    }
  }

  /**
   * Télécharge un fichier par son uploadToken avec validation du mot de passe optionnel
   * US02: Download - Accès au fichier via lien unique, mot de passe optionnel
   * @param uploadToken Token d'accès unique du fichier
   * @param password Mot de passe du fichier (optionnel, requis si filePasswordHash existe)
   * @returns Buffer du fichier pour le téléchargement
   * @throws NotFoundException si le fichier n'existe pas
   * @throws BadRequestException si le mot de passe est incorrect ou manquant
   */
  async downloadFile(uploadToken: string, password?: string): Promise<Buffer> {
    const file = await this.findByUploadToken(uploadToken)

    if (!file) {
      throw new NotFoundException('Fichier introuvable ou lien invalide')
    }

    // Vérifier l'expiration
    if (file.expiresAt && new Date() > file.expiresAt) {
      throw new BadRequestException('Ce lien de fichier a expiré')
    }

    // Vérifier le mot de passe si le fichier est protégé
    if (file.filePasswordHash) {
      if (!password) {
        throw new BadRequestException('Ce fichier est protégé par mot de passe. Veuillez fournir un mot de passe.')
      }

      const isPasswordValid = await bcrypt.compare(password, file.filePasswordHash)
      if (!isPasswordValid) {
        throw new BadRequestException('Mot de passe invalide')
      }
    }

    try {
      return await this.storageService.getFile(file.path)
    } catch (error) {
      this.logger.error(`Failed to retrieve file ${file.id}: ${error.message}`)
      throw new NotFoundException('Fichier introuvable dans le stockage')
    }
  }

  /**
   * Sauvegarde un fichier uploadé avec mot de passe optionnel (pour US09)
   * Met à jour la logique create pour gérer le mot de passe
   * @param fileData Fichier uploadé par Multer
   * @param userId ID de l'utilisateur propriétaire
   * @param createFileDto Métadonnées optionnelles (tags, password, expiration)
   * @returns UploadResponseDto avec les métadonnées et le token
   */
  async createWithPassword(
    fileData: MulterFile,
    userId?: string,
    createFileDto?: CreateFileDto,
  ): Promise<UploadResponseDto> {
    if (!fileData) {
      throw new BadRequestException('No file uploaded')
    }

    // Générer un token UUID unique pour le fichier
    const uploadToken = randomUUID()

    const filename = `${uploadToken}-${fileData.originalname}`
    const storagePrefix = userId ? userId : 'anonymous'
    const filepath = `${storagePrefix}/${filename}`

    try {
      // Sauvegarder le fichier dans le stockage
      const savedPath = await this.storageService.saveFile(fileData.buffer, filepath)

      // Hash du mot de passe si fourni
      let filePasswordHash = null
      if (createFileDto?.filePassword) {
        filePasswordHash = await bcrypt.hash(createFileDto.filePassword, 10)
      }

       // Créer l'entité fichier
       const file = this.filesRepository.create({
         uploadToken,
         name: filename,
         originalName: fileData.originalname,
         mimetype: fileData.mimetype,
         size: fileData.size,
         path: savedPath,
         storageType: 'local',
         userId: userId ?? null,
         // Deduplicate tags if present
         tags: createFileDto?.tags ? JSON.stringify(Array.from(new Set(createFileDto.tags))) : null,
         filePasswordHash,
         expiresAt: this.calculateExpirationDate(createFileDto?.expirationDays),
       })

      const savedFile = await this.filesRepository.save(file)

      this.logger.log(`File uploaded successfully: ${uploadToken} by user ${userId}`)

      return this.mapToUploadResponseDto(savedFile)
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`)
      throw new BadRequestException(`Failed to save file: ${error.message}`)
    }
  }

  async createAnonymous(
    fileData: MulterFile,
    createFileDto?: CreateFileDto,
  ): Promise<UploadResponseDto> {
    return this.createWithPassword(fileData, undefined, createFileDto)
  }

  /**
   * Vérifie si un fichier a expiré
   * US10: Vérification automatique d'expiration à chaque accès
   *
   * Logique :
   * - Si file.expiresAt est null : fichier n'expire jamais → false
   * - Si file.expiresAt est dans le passé : fichier expiré → true
   * - Si file.expiresAt est dans le futur : fichier valide → false
   *
   * Appelée lors de :
   * - POST /files/{token}/download : avant téléchargement
   * - GET /files/{token} : avant affichage des métadonnées
   * - Tâche Cron de purge : suppression des fichiers expirés
   *
   * @param {File} file - Entité File depuis la base de données
   * @returns {boolean} true si le fichier a expiré, false sinon
   *
   * @example
   * if (filesService.isFileExpired(file)) {
   *   throw new BadRequestException('This file link has expired')
   * }
   */
  isFileExpired(file: File): boolean {
    return file.expiresAt ? new Date() > file.expiresAt : false
  }

  /**
   * Récupère tous les fichiers d'un utilisateur
   * US05: Historique - Accès réservé au propriétaire
   * @param userId ID de l'utilisateur
   * @param includeExpired Inclure les fichiers expirés (défaut false)
   * @returns Liste des fichiers de l'utilisateur sous forme de DTO
   */
  async findAll(userId: string, includeExpired: boolean = false): Promise<FileListItemDto[]> {
    const query = this.filesRepository.createQueryBuilder('file')
      .where('file.userId = :userId', { userId })
      .orderBy('file.createdAt', 'DESC')

    if (!includeExpired) {
      query.andWhere('(file.expiresAt IS NULL OR file.expiresAt > :now)', { now: new Date() })
    }

    const files = await query.getMany()
    return files.map(file => this.mapToFileListItemDto(file))
  }

  /**
   * Déduplique et valide les tags (US08)
   * - Supprime les doublons
   * - Convertit en minuscules pour cohérence
   * - Vérifie que chaque tag ne dépasse pas 30 caractères
   * @param tags Tableau de tags bruts
   * @returns Tableau de tags uniques et validés
   */
  private deduplicateTags(tags?: string[]): string[] {
    if (!tags || tags.length === 0) return []

    // Déduplicater (sensible à la casse pour préserver l'intention utilisateur)
    const uniqueTags = Array.from(new Set(tags))

    // Valider que chaque tag ne dépasse pas 30 caractères
    const validTags = uniqueTags.filter(tag => {
      if (tag.length > 30) {
        this.logger.warn(`Tag exceeds 30 characters: "${tag.substring(0, 30)}...". Filtered out.`)
        return false
      }
      return true
    })

    return validTags
  }
}
