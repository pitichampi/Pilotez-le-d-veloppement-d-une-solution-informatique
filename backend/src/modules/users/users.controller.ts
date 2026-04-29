import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto'
import { JwtGuard } from '@common/guards/jwt.guard'

/**
 * Contrôleur de gestion des utilisateurs (UsersController)
 * Endpoints CRUD pour les utilisateurs
 *
 * ⚠️ ATTENTION : Tous les endpoints sont protégés par JWT
 * À utiliser avec modération en production (risque de fuite de données)
 *
 * Endpoints :
 * - GET /api/users → Liste tous les utilisateurs
 * - GET /api/users/:id → Récupère un utilisateur
 * - PATCH /api/users/:id → Met à jour un utilisateur
 * - DELETE /api/users/:id → Supprime un utilisateur
 *
 * Sécurité :
 * - Tous les endpoints sont protégés par @UseGuards(JwtGuard)
 * - Les mots de passe sont toujours exclus des réponses
 * - Les modifications d'utilisateurs sont possibles (non restrictives)
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Récupère la liste de TOUS les utilisateurs
   * Endpoint protégé par JWT
   *
   * GET /api/users
   * Headers : Authorization: Bearer {jwt}
   *
   * Réponse 200 : Tableau de UserResponseDto
   * [
   *   { "id": "uuid1", "email": "alice@example.com", "username": "alice", "role": "user", "createdAt": "..." },
   *   { "id": "uuid2", "email": "bob@example.com", "username": "bob", "role": "user", "createdAt": "..." }
   * ]
   *
   * ⚠️ RISQUE SÉCURITÉ : Cet endpoint expose tous les utilisateurs
   * À implémenter avec pagination ou restriction en production
   *
   * @returns Tableau de UserResponseDto (sans mots de passe)
   */
  @Get()
  @UseGuards(JwtGuard)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll()
    return users.map((user) => this.usersService.toResponseDto(user))
  }

  /**
   * Récupère un utilisateur par son ID
   * Endpoint protégé par JWT
   *
   * GET /api/users/{id}
   * Headers : Authorization: Bearer {jwt}
   *
   * Réponse 200 : UserResponseDto
   * {
   *   "id": "uuid",
   *   "email": "alice@example.com",
   *   "username": "alice",
   *   "role": "user",
   *   "createdAt": "2025-04-29T..."
   * }
   *
   * Erreurs :
   * - 404 : Utilisateur introuvable
   * - 401 : JWT manquant ou invalide
   *
   * @param id UUID de l'utilisateur
   * @returns UserResponseDto (sans mot de passe)
   */
  @Get(':id')
  @UseGuards(JwtGuard)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id)
    return this.usersService.toResponseDto(user)
  }

  /**
   * Met à jour un utilisateur (partiellement)
   * Endpoint protégé par JWT
   *
   * PATCH /api/users/{id}
   * Headers : Authorization: Bearer {jwt}
   *
   * Body (Partial<CreateUserDto>) :
   * {
   *   "username": "alice_new",
   *   "password": "NewPassword123!"
   * }
   *
   * Réponse 200 : UserResponseDto avec les modifications
   * {
   *   "id": "uuid",
   *   "email": "alice@example.com",
   *   "username": "alice_new",
   *   "role": "user",
   *   "createdAt": "2025-04-29T..."
   * }
   *
   * Erreurs :
   * - 404 : Utilisateur introuvable
   * - 400 : Validation échouée
   * - 401 : JWT manquant ou invalide
   *
   * ⚠️ RISQUE SÉCURITÉ : Pas de vérification de propriété
   * N'importe quel utilisateur authentifié peut modifier n'importe quel compte
   * À implémenter avec vérification (req.user.sub === id) en production
   *
   * @param id UUID de l'utilisateur
   * @param updateUserDto Propriétés à mettre à jour
   * @returns UserResponseDto mis à jour
   */
  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: Partial<CreateUserDto>) {
    const user = await this.usersService.update(id, updateUserDto)
    return this.usersService.toResponseDto(user)
  }

  /**
   * Supprime un utilisateur (suppression logique recommandée)
   * Endpoint protégé par JWT
   *
   * DELETE /api/users/{id}
   * Headers : Authorization: Bearer {jwt}
   *
   * Réponse 200 :
   * { "message": "User deleted successfully" }
   *
   * Erreurs :
   * - 404 : Utilisateur introuvable
   * - 401 : JWT manquant ou invalide
   *
   * ⚠️ RISQUE SÉCURITÉ : Pas de vérification de propriété
   * N'importe quel utilisateur authentifié peut supprimer n'importe quel compte
   * À implémenter avec vérification (req.user.sub === id) en production
   *
   * ⚠️ IMPORTANT : Suppression physique (DELETE en BD)
   * Recommandation : Implémenter suppression logique avec colonne deleted_at
   *
   * @param id UUID de l'utilisateur
   * @returns Message de confirmation
   */
  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(id)
    return { message: 'User deleted successfully' }
  }
}

