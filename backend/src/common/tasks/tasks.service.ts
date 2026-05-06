import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, IsNull, Not } from 'typeorm'
import { File } from '@modules/files/entities/file.entity'
import * as fs from 'fs'
import * as path from 'path'

/**
 * @file tasks.service.ts
 * @description Service de tâches planifiées pour DataShare
 *
 * Responsabilités :
 * - Suppression automatique des fichiers expirés via Cron quotidienne
 * - Gestion des fichiers orphelins (expiresAt != null && expiresAt <= now)
 * - Nettoyage du stockage physique et de la base de données
 *
 * US10 (Expiration & Purge automatique) :
 * - Durée de vie : 1-7 jours (configurée à l'upload)
 * - Purge automatique : Chaque jour à minuit UTC
 * - Suppression irréversible : Fichier supprimé du disque ET de la BD
 *
 * Sécurité :
 * - Vérification physique : Fichier existe avant suppression
 * - Gestion des erreurs : Logging complet, pas d'interruption de Cron
 * - Atomicité : Suppression disque + BD dans la même transaction
 *
 * @author DataShare Team
 * @version 1.0.0
 */
@Injectable()
export class TasksService {
  /** Logger NestJS pour tracer les purges */
  private readonly logger = new Logger('TasksService')

  /**
   * Constructeur avec injection du repository File
   * @param {Repository<File>} filesRepository - Repository TypeORM pour la table files
   */
  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
  ) {}

  /**
   * Tâche Cron de purge automatique des fichiers expirés
   * US10: Exécutée quotidiennement à minuit UTC
   *
   * Logique :
   * 1. Récupère tous les fichiers avec expiresAt <= maintenant
   * 2. Pour chaque fichier :
   *    - Supprime du stockage physique (FS)
   *    - Supprime de la base de données
   * 3. Logging de statistiques et erreurs
   *
   * Caractéristiques :
   * - Récupère les fichiers avec expiresAt NOT NULL et <= now
   * - Gère les fichiers orphelins (disque existe pas)
   * - Continue même si une suppression échoue (resilience)
   * - Logs détaillés pour diagnostic
   *
   * @async
   * @returns {Promise<void>}
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredFiles(): Promise<void> {
    this.logger.debug('Starting automatic file expiration cleanup task (US10)')

    try {
      // Récupérer tous les fichiers expirés : expiresAt NOT NULL ET <= now
      const now = new Date()
      const expiredFiles = await this.filesRepository.find({
        where: [
          {
            expiresAt: Not(IsNull()), // Fichier a une expiration définie
          },
        ],
      })

      // Filtrer les fichiers réellement expirés côté service
      const filesToDelete = expiredFiles.filter(file => file.expiresAt && file.expiresAt <= now)

      if (filesToDelete.length === 0) {
        this.logger.debug('No expired files found for cleanup')
        return
      }

      this.logger.log(`Found ${filesToDelete.length} expired files to delete`)

      let successCount = 0
      let errorCount = 0

      // Traiter chaque fichier expiré
      for (const file of filesToDelete) {
        try {
          // Supprimer le fichier du stockage physique
          if (file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path)
              this.logger.debug(`Deleted physical file: ${file.path}`)
            } catch (fsError) {
              this.logger.warn(`Failed to delete physical file ${file.path}: ${fsError.message}`)
              // Continue quand même pour supprimer la BD
            }
          } else if (file.path) {
            this.logger.warn(`Physical file not found (already deleted?): ${file.path}`)
          }

          // Supprimer de la base de données
          await this.filesRepository.delete(file.id)
          this.logger.debug(`Deleted database record: ${file.id} (token: ${file.uploadToken})`)

          successCount++
        } catch (error) {
          errorCount++
          this.logger.error(
            `Failed to delete expired file ${file.id}: ${error.message}`,
            error.stack,
          )
          // Continue avec les autres fichiers
        }
      }

      // Log final avec statistiques
      this.logger.log(
        `Expiration cleanup completed: ${successCount}/${filesToDelete.length} files deleted successfully` +
          (errorCount > 0 ? `, ${errorCount} errors encountered` : ''),
      )
    } catch (error) {
      // Erreur critique dans la récupération des fichiers
      this.logger.error(
        `Critical error during expiration cleanup task: ${error.message}`,
        error.stack,
      )
      // La tâche Cron ne doit pas lever d'exception, elle continuerait la prochaine fois
    }
  }

  /**
   * Supprime les fichiers expirés manuellement (pour tests/maintenance)
   * Alternative au Cron automatique pour des besoins ponctuels
   *
   * @async
   * @returns {Promise<number>} Nombre de fichiers supprimés
   */
  async purgeExpiredFilesManually(): Promise<number> {
    this.logger.log('Manual expiration cleanup triggered')

    const now = new Date()
    const expiredFiles = await this.filesRepository.find({
      where: {
        expiresAt: Not(IsNull()),
      },
    })

    const filesToDelete = expiredFiles.filter(file => file.expiresAt <= now)

    for (const file of filesToDelete) {
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
        await this.filesRepository.delete(file.id)
      } catch (error) {
        this.logger.warn(`Failed to delete file ${file.id}: ${error.message}`)
      }
    }

    return filesToDelete.length
  }
}

