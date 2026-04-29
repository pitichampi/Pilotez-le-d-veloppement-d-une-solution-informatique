import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '@common/common.module'
import { File } from './entities/file.entity'
import { FilesService } from './files.service'
import { FilesController } from './files.controller'
import { LocalStorageService } from './storage/local-storage.service'

/**
 * Module de gestion des fichiers (FilesModule)
 * Centralise la logique d'upload, téléchargement et suppression de fichiers
 *
 * Composants :
 * - FilesService : Logique métier (upload, download, delete, validation)
 * - FilesController : Endpoints REST protégés et publics
 * - LocalStorageService : Abstraction pour le stockage (local FS, future S3)
 * - File (Entity) : Entité TypeORM mappée sur la table files
 *
 * Dépendances :
 * - TypeOrmModule.forFeature([File]) : Enregistre le repository File
 * - CommonModule : Configuration globale (guards, pipes, tasks)
 *
 * Exports :
 * - FilesService : Peut être utilisé par d'autres modules si besoin
 *
 * Entité File :
 * - id (UUID, PK)
 * - uploadToken (UUID unique, PK d'accès public)
 * - name (UUID-originalname.ext)
 * - originalName (nom fourni par user)
 * - size (bytes)
 * - mimetype (application/pdf, image/png, etc.)
 * - filePasswordHash (bcrypt hashé, optionnel)
 * - expiresAt (date d'expiration, optionnel)
 * - tags (JSON stringifié)
 * - userId (FK → User)
 * - createdAt
 *
 * Endpoints :
 * - POST /api/files/upload (protégé JWT) → US01
 * - GET /api/files (protégé JWT) → US05 Historique
 * - GET /api/files/share/:token/metadata (public) → US02
 * - POST /api/files/share/:token/download (public) → US02
 * - DELETE /api/files/:id (protégé JWT) → US06
 *
 * Stockage :
 * - LocalStorageService : Stockage local en /uploads/{userId}/{uploadToken}-name
 * - Architecture abstraite : Facilite migration vers S3 sans impact controller
 *
 * Sécurité :
 * - Validation taille : max 1 Go
 * - Validation types : whitelist MIME + détection signature magique
 * - Extensions interdites : .exe, .bat, .sh, .msi, .cmd, .ps1
 * - Mot de passe : hachage bcrypt(cost=10), jamais en clair
 * - Expiration : Purge automatique Cron @midnight (US10)
 */
@Module({
  imports: [TypeOrmModule.forFeature([File]), CommonModule],
  controllers: [FilesController],
  providers: [FilesService, LocalStorageService],
  exports: [FilesService],
})
export class FilesModule {}

