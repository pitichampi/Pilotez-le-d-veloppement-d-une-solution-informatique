import { IsOptional, IsString, MinLength } from 'class-validator'

/**
 * DTO pour la requête de téléchargement d'un fichier (US02)
 * Corps (body) de la requête POST /api/files/share/{uploadToken}/download
 *
 * Endpoint PUBLIC (pas d'authentification requise)
 * Méthode POST (pas GET) pour sécuriser le mot de passe
 * ⚠️ Le mot de passe ne passe JAMAIS en URL (logs/historique)
 *
 * Validation :
 * - password : Optionnel (requis seulement si fichier protégé)
 * - Min 8 caractères si fourni (idem que filePassword lors de l'upload)
 */
export class DownloadFileDto {
  /**
   * Mot de passe du fichier (optionnel)
   * Requis seulement si isPasswordProtected=true
   *
   * Processus de validation :
   * 1. Frontend récupère isPasswordProtected via GET /metadata
   * 2. Si true, afficher formulaire de mot de passe
   * 3. User saisi le mot de passe
   * 4. POST /download { password: "..." }
   * 5. Serveur : bcrypt.compare(password, filePasswordHash)
   *
   * Erreurs possibles :
   * - 400 : Mot de passe manquant pour fichier protégé
   * - 401 : Mot de passe incorrect (bcrypt.compare = false)
   *
   * Sécurité :
   * - Le mot de passe est en HTTPS (chiffrage TLS)
   * - Pas de logs du mot de passe côté serveur
   * - Comparaison avec bcrypt.compare (protection timing attacks)
   */
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'File password must be at least 8 characters' })
  password?: string
}

