import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '@common/common.module'
import { User } from './entities/user.entity'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'

/**
 * Module de gestion des utilisateurs (UsersModule)
 * Centralise la logique CRUD des utilisateurs
 *
 * Composants :
 * - UsersService : Opérations CRUD (create, find, update, delete)
 * - UsersController : Endpoints REST (GET, PATCH, DELETE)
 * - User (Entity) : Entité TypeORM mappée sur la table users
 *
 * Dépendances :
 * - TypeOrmModule.forFeature([User]) : Enregistre le repository User
 * - CommonModule : Configuration globale et guards/pipes
 *
 * Exports :
 * - UsersService : Utilisé par AuthModule pour l'authentification
 *
 * Entité User :
 * - id (UUID, PK)
 * - email (unique)
 * - username
 * - password (hashé en bcrypt)
 * - role
 * - createdAt
 *
 * ⚠️ SÉCURITÉ : Les endpoints UsersController exposent TOUS les utilisateurs
 * À implémenter avec contrôles d'accès (admin uniquement) en production
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), CommonModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

