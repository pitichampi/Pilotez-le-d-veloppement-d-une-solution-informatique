import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/**
 * DTO pour la création/upload d'un fichier
 * US01: Upload de fichiers avec validation de sécurité
 */
export class CreateFileDto {
  /**
   * Tags optionnels pour organiser les fichiers (0-N tags, 30 chars max chacun)
   * US08: Tags - 0-N tags, 30 chars max
   */
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[]

  /**
   * Mot de passe optionnel pour protéger le fichier (6+ chars si fourni)
   * US09: Sécurité fichier - Mot de passe optionnel 6+ chars
   */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'File password must be at least 6 characters' })
  filePassword?: string

  /**
   * Durée de vie du fichier en jours (1-7 jours)
   * US10: Expiration - 1-7 jours
   */
  @IsOptional()
  expirationDays?: number
}

