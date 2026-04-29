import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

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
 * - filePassword : Min 6 chars si fourni (hachage bcrypt au serveur)
 * - expirationDays : Plage 1-7 validée en service
 */
export class CreateFileDto {
  /**
   * Tags optionnels pour organiser/catégoriser les fichiers (US08)
   * 0-N tags par fichier
   * Chaque tag : max 30 caractères
   * Dédoublonnés automatiquement (suppression des doublons)
   *
   * Exemple : ["projet", "confidential", "2025-Q1"]
   */
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[]

  /**
   * Mot de passe pour protéger le fichier (US09 - Sécurité)
   * Optionnel : Si vide, le fichier est public
   * Min 6 caractères (validation côté serveur)
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
  @MinLength(6, { message: 'File password must be at least 6 characters' })
  filePassword?: string

  /**
   * Durée de vie du fichier en jours (US10 - Expiration)
   * Optionnel : défaut 7 jours si non fourni
   * Plage valide : 1-7 jours
   *
   * Logique :
   * - 1 jour : Lien actif 24h après upload
   * - 7 jours : Lien valide une semaine (défaut)
   * - Purge automatique : Tâche Cron quotidienne @midnight
   * - Erreur 410 : Retourné si fichier expiré lors d'un accès
   *
   * Exemple : expirationDays=3 → Expire dans 3 jours
   */
  @IsOptional()
  expirationDays?: number
}

