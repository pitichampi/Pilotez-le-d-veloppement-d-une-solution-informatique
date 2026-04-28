import { IsOptional, IsString, MinLength } from 'class-validator'

/**
 * DTO pour la requête de téléchargement d'un fichier
 * US02: Download - Mot de passe requis uniquement si le fichier est protégé
 */
export class DownloadFileDto {
  /**
   * Mot de passe du fichier (requis si le fichier est protégé, optionnel sinon)
   * US09: Sécurité fichier - Mot de passe optionnel 6+ chars
   */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'File password must be at least 6 characters' })
  password?: string
}

