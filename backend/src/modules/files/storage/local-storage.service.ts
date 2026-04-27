import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs/promises'
import * as path from 'path'
import { IStorageService } from './storage.interface'

/**
 * Implémentation locale du service de stockage
 * Stocke les fichiers sur le système de fichiers local
 * Future migration: Remplacer par S3StorageService
 */
@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger('LocalStorageService')
  private readonly storagePath: string

  constructor(private configService: ConfigService) {
    this.storagePath = this.configService.get('FILE_STORAGE_PATH') || '/app/uploads'
    this.initializeStoragePath()
  }

  /**
   * Initialise le répertoire de stockage
   */
  private async initializeStoragePath(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true })
      this.logger.log(`Storage directory ready at: ${this.storagePath}`)
    } catch (error) {
      this.logger.error(`Failed to initialize storage path: ${error.message}`)
    }
  }

  /**
   * Sauvegarde un fichier dans le stockage local
   * @param fileBuffer Contenu du fichier
   * @param filename Nom du fichier (format: {userId}/{uploadToken}-{originalname})
   * @returns Chemin complet du fichier sauvegardé
   */
  async saveFile(fileBuffer: Buffer, filename: string): Promise<string> {
    const filepath = path.join(this.storagePath, filename)

    // Créer le répertoire utilisateur s'il n'existe pas
    const dir = path.dirname(filepath)
    await fs.mkdir(dir, { recursive: true })

    // Sauvegarder le fichier
    await fs.writeFile(filepath, fileBuffer)

    this.logger.debug(`File saved: ${filepath}`)
    return filepath
  }

  /**
   * Récupère un fichier du stockage local
   * @param filepath Chemin complet du fichier
   * @returns Buffer du fichier
   * @throws Error si le fichier n'existe pas
   */
  async getFile(filepath: string): Promise<Buffer> {
    const buffer = await fs.readFile(filepath)
    this.logger.debug(`File retrieved: ${filepath}`)
    return buffer
  }

  /**
   * Supprime un fichier du stockage local
   * @param filepath Chemin complet du fichier
   */
  async deleteFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath)
      this.logger.debug(`File deleted: ${filepath}`)
    } catch (error) {
      this.logger.warn(`Failed to delete file ${filepath}: ${error.message}`)
    }
  }

  /**
   * Vérifie l'existence d'un fichier
   * @param filepath Chemin complet du fichier
   * @returns true si le fichier existe
   */
  async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath)
      return true
    } catch {
      return false
    }
  }
}

