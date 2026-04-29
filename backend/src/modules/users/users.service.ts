import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto'

/**
 * Service de gestion des utilisateurs (UsersService)
 * Opérations CRUD basiques sur l'entité User
 *
 * US03/04 : Création, recherche et gestion des comptes utilisateur
 * L'authentification est gérée par AuthService
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Crée un nouvel utilisateur en base de données
   * Appelé par AuthService lors de l'enregistrement
   *
   * @param createUserDto { email, username, password (hashé) }
   * @returns Utilisateur créé avec ID UUID généré
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto)
    return this.usersRepository.save(user)
  }

  /**
   * Récupère tous les utilisateurs de la base de données
   * ⚠️ À utiliser avec prudence en production (risque de fuite de données)
   *
   * @returns Liste complète des utilisateurs
   */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find()
  }

  /**
   * Récupère un utilisateur par son ID UUID
   * Utilisé pour la récupération du profil, la vérification de propriété
   *
   * @param id UUID de l'utilisateur
   * @returns Utilisateur trouvé ou null
   */
  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } })
  }

  /**
   * Récupère un utilisateur par son email
   * Utilisé lors du login (US04) et de la vérification d'unicité à l'enregistrement (US03)
   *
   * @param email Email de l'utilisateur
   * @returns Utilisateur trouvé ou null
   */
  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } })
  }

  /**
   * Met à jour les informations d'un utilisateur
   * Utilisable pour modifier le profil après authentification
   *
   * @param id UUID de l'utilisateur
   * @param updateUserDto Propriétés à mettre à jour (partielles)
   * @returns Utilisateur mis à jour
   */
  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateUserDto)
    return this.findOne(id)
  }

  /**
   * Supprime un utilisateur de la base de données
   * ⚠️ Suppression logique recommandée en production (colonne deleted_at)
   *
   * @param id UUID de l'utilisateur
   */
  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id)
  }

  /**
   * Convertit une entité User en DTO de réponse
   * Exclut le mot de passe hashé du résultat (sécurité)
   * Utilisé avant de retourner les données au client
   *
   * @param user Entité User complète (avec mot de passe)
   * @returns UserResponseDto sans le mot de passe
   */
  toResponseDto(user: User): UserResponseDto {
    const { password, ...result } = user
    return result as UserResponseDto
  }
}

