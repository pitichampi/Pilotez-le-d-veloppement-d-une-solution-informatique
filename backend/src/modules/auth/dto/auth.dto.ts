import { IsEmail, IsString, MinLength } from 'class-validator'

/**
 * DTO pour la connexion (US04)
 * Validé automatiquement par le ValidationPipe global
 *
 * Validation :
 * - email : Format email valide (RFC 5322)
 * - password : Minimum 8 caractères
 */
export class LoginDto {
  /**
   * Email de l'utilisateur
   * Doit être unique en base de données
   */
  @IsEmail()
  email: string

  /**
   * Mot de passe en clair
   * ⚠️ Le frontend DOIT utiliser HTTPS pour éviter l'interception
   * Le serveur hashera ce mot de passe avec bcrypt (cost 10)
   */
  @IsString()
  @MinLength(8)
  password: string
}

/**
 * DTO pour l'enregistrement (US03)
 * Crée un nouvel utilisateur
 *
 * Validation :
 * - email : Format email valide et unique (contrôle en service)
 * - username : 3-50 caractères
 * - password : Minimum 8 caractères
 */
export class RegisterDto {
  /**
   * Email unique de l'utilisateur
   * Vérification d'unicité effectuée dans AuthService.register()
   * Code retour 409 si email déjà enregistré
   */
  @IsEmail()
  email: string

  /**
   * Nom d'utilisateur
   * Utilisé pour l'affichage public du profil
   */
  @IsString()
  @MinLength(3)
  username: string

  /**
   * Mot de passe en clair (minimum 8 caractères)
   * Sera hashé avec bcrypt(cost=10) avant stockage en BD
   */
  @IsString()
  @MinLength(8)
  password: string
}

/**
 * DTO pour la réponse d'authentification (US03/04)
 * Retourné après register() ou login()
 *
 * Contient :
 * - JWT : Token d'authentification (header Authorization: Bearer <token>)
 * - User : Profil de l'utilisateur (sans le mot de passe)
 */
export class AuthResponseDto {
  /**
   * JWT signé (JwtService.sign)
   * Payload : { sub: userId, email }
   * À inclure dans le header Authorization: Bearer {token}
   */
  token: string

  /**
   * Profil utilisateur (sécurisé - sans mot de passe)
   */
  user: {
    id: string                    // UUID généré par la BD
    email: string                 // Email unique
    username: string              // Nom d'affichage
    createdAt: Date               // Date de création du compte
  }
}

