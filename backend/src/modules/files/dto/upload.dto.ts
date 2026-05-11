import { IsOptional, IsString, MaxLength, MinLength, IsNumber, Min, Max, IsInt } from 'class-validator'
import { Type, Transform } from 'class-transformer'

/**
 * DTO pour la création/upload d'un fichier (US01/07)
 * Validé automatiquement par le ValidationPipe global
 * Reçu en tant que données multipart (application/x-www-form-urlencoded) lors de l'upload
 *
 * Endpoint : POST /api/files/upload
 * Content-Type : multipart/form-data
 *
 * Validation automatique effectuée :
 * - tags[] : Chaque tag max 30 chars
 * - filePassword : Min 8 chars si fourni (hachage bcrypt au serveur)
 * - expirationDays : Plage 1-7 validée avec @Min(1) @Max(7)
 *
 * @author DataShare Team
 * @version 1.0.0
 */
export class CreateFileDto {
  /**
   * Tags optionnels pour organiser/catégoriser les fichiers (US08)
   * 0-N tags par fichier
   * Chaque tag : max 30 caractères
   * Dédoublonnés automatiquement (suppression des doublons)
   *
   * Exemple : ["projet", "confidential", "2025-Q1"]
   *
   * Le transformer parse les tags s'ils arrivent comme JSON string (multipart/form-data)
   * ou comme un array direct (application/json)
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  })
  @IsString({ each: true })
  @MaxLength(30, { each: true, message: 'Chaque tag doit contenir au maximum 30 caractères' })
  tags?: string[]

  /**
   * Mot de passe pour protéger le fichier (US09 - Sécurité)
   * Optionnel : Si vide, le fichier est public
   * Min 8 caractères (validation côté serveur)
   *
   * Processus :
   * 1. Reçu en clair du client via HTTPS
   * 2. Hashé avec bcrypt(cost=10) au serveur
   * 3. Jamais stocké en clair en BD
   * 4. Validé lors du téléchargement avec bcrypt.compare()
   *
   * Erreur 401 si mot de passe incorrect au téléchargement
   */
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe du fichier doit contenir au minimum 8 caractères' })
  filePassword?: string

  /**
   * Durée de vie du fichier en jours (US10 - Expiration & Purge automatique)
   * Optionnel : défaut null (pas d'expiration) si non fourni
   * Plage valide : 1-7 jours
   *
   * Logique :
   * - 1 jour : Lien actif 24h après upload
   * - 7 jours : Lien valide une semaine (défaut recommandé)
   * - Purge automatique : Tâche Cron quotidienne à minuit UTC (@Cron)
   * - Erreur 410 : Retourné si fichier expiré lors d'un accès
   *
   * Validation :
   * - @IsOptional : Non requis
   * @Type(() => Number) : Convertit string → number (multipart form data)
   * - @IsNumber : Doit être un nombre
   * - @IsInt : Doit être un entier
   * - @Min(1) : Minimum 1 jour
   * - @Max(7) : Maximum 7 jours
   *
   * Exemple : expirationDays=3 → Expire dans 3 jours
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'expirationDays doit être un nombre' })
  @IsInt({ message: 'expirationDays doit être un entier' })
  @Min(1, { message: 'expirationDays doit être au minimum 1 jour' })
  @Max(7, { message: 'expirationDays doit être au maximum 7 jours' })
  expirationDays?: number
}

