import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmConfigService } from '@config/typeorm.config'
import { AuthModule } from '@modules/auth/auth.module'
import { UsersModule } from '@modules/users/users.module'
import { FilesModule } from '@modules/files/files.module'
import { TasksModule } from '@common/tasks/tasks.module'

/**
 * Module racine (AppModule) de l'application DataShare
 * Centralise l'enregistrement de tous les modules fonctionnels :
 * - AuthModule : Inscription, connexion, JWT
 * - UsersModule : Gestion des utilisateurs
 * - FilesModule : Upload, téléchargement, suppression de fichiers
 * - TasksModule : Tâches planifiées (purge automatique des fichiers expirés)
 * - ConfigModule : Gestion des variables d'environnement
 * - ScheduleModule : Support des tâches Cron
 * - TypeOrmModule : Connexion à la base de données PostgreSQL
 */
@Module({
  imports: [
    /**
     * ConfigModule : Charge les variables d'environnement
     * - Cherche .env et .env.local
     * - isGlobal: true → Accessible partout dans l'app (pas de réimport)
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    /**
     * ScheduleModule : Active le support des tâches programmées (@Cron)
     * Utilisé dans FilesService pour la purge automatique des fichiers expirés (US10)
     */
    ScheduleModule.forRoot(),

    /**
     * TypeOrmModule : Connexion à PostgreSQL
     * - forRootAsync : Configuration asynchrone via ConfigService
     * - TypeOrmConfigService : Gère les options de connexion (URL, entités, etc.)
     * Entités enregistrées :
     *   - User : Utilisateurs avec email, mot de passe hashé
     *   - File : Métadonnées des fichiers uploadés (uploadToken, expiresAt, etc.)
     */
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new TypeOrmConfigService(configService).createTypeOrmOptions()
      },
    }),

    // Modules fonctionnels
    AuthModule,    // POST /auth/register, /auth/login, GET /auth/me
    UsersModule,   // Gestion des utilisateurs
    FilesModule,   // POST /files (upload), GET /files (historique), DELETE /files/:id
    TasksModule,   // Tâche Cron pour purger les fichiers expirés
  ],
})
export class AppModule {}
