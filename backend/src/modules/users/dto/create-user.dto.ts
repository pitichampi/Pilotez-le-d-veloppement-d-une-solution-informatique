import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

/**
 * DTO pour la création d'un utilisateur
 * Utilisé uniquement par AuthService.register()
 *
 * Validation :
 * - email : Format email valide, unicité vérifiée en service
 * - username : 3-50 caractères
 * - password : Minimum 8 caractères (déjà hashé par le caller)
 */
export class CreateUserDto {
  /**
   * Email unique de l'utilisateur
   * Format valide : RFC 5322 (exemple@domaine.com)
   * Vérification d'unicité : effectuée dans AuthService
   */
  @IsEmail()
  email: string

  /**
   * Nom d'utilisateur / display name
   * 3-50 caractères (exemple: "Alice", "alice_123")
   * Non utilisé pour l'authentification (c'est l'email qui identifie)
   */
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string

  /**
   * Mot de passe hashé avec bcrypt
   * ⚠️ IMPORTANT : Doit TOUJOURS être hashé AVANT d'être stocké en BD
   * Le hachage est effectué dans AuthService.register() avec bcrypt(cost=10)
   * Jamais de mot de passe en clair en base de données !
   */
  @IsString()
  @MinLength(8)
  password: string
}

/**
 * DTO pour la réponse utilisateur
 * Retourné après authentification réussie (profil du courant utilisateur)
 *
 * Contient les informations publiques de l'utilisateur
 * ⚠️ Le mot de passe est EXCLU (sécurité)
 */
export class UserResponseDto {
  /**
   * UUID généré par PostgreSQL
   * Utilisé pour identifier l'utilisateur dans les requêtes
   */
  id: string

  /**
   * Email unique de l'utilisateur
   * Identifiant principal pour la connexion
   */
  email: string

  /**
   * Nom d'affichage public
   * Peut être modifié sans impact sur l'authentification
   */
  username: string

  /**
   * Rôle de l'utilisateur (admin, user, etc.)
   * Pour contrôle d'accès futur
   */
  role: string

  /**
   * Date de création du compte
   * Format ISO 8601 UTC (2025-04-28T10:30:00Z)
   */
  createdAt: Date
}

