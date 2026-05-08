import { Transform } from 'class-transformer'

/**
 * DTO pour les métadonnées d'un fichier (US02)
 * Retourné par GET /api/files/{uploadToken}
 *
 * Endpoint PUBLIC (pas d'authentification requise)
 * Accessible avant le téléchargement pour afficher les informations au client
 *
 * Processus :
 * 1. Utilisateur accède au lien partagé
 * 2. Frontend appelle GET /api/files/{token}
 * 3. Réponse : DownloadMetadataDto
 * 4. Frontend affiche les infos et formulaire de téléchargement
 * 5. Utilisateur clique "Télécharger" → PUT /api/files/{token}/download
 */
export class DownloadMetadataDto {
  /**
   * Nom original du fichier
   * Affiché au client dans la page de téléchargement
   * Utilisé comme nom du fichier téléchargé
   * Exemple : "rapport-financier-2025.pdf"
   */
  @Transform(({ value }) => value, { toPlainOnly: true })
  original_name: string

  /**
   * Taille du fichier en bytes
   * Affichée formatée au client (200 KB, 1.5 MB, etc.)
   * Validation : max 1 Go (1024^3 bytes)
   */
  @Transform(({ value }) => value, { toPlainOnly: true })
  size_bytes: number

  /**
   * Type MIME du fichier
   * Affichage du type au client (application/pdf, image/png, etc.)
   * Utilisé pour l'icône et les informations de type
   */
  @Transform(({ value }) => value, { toPlainOnly: true })
  mime_type: string

  /**
   * Date d'expiration du lien
   * Optional : null si aucune expiration
   * Format ISO 8601 UTC
   * Affichée au client pour montrer jusqu'à quand le lien est valide
   * Erreur 410 (Gone) si accès après cette date
   */
  @Transform(({ value }) => value ? value.toISOString() : null, { toPlainOnly: true })
  expires_at?: Date

   /**
    * Indicateur : Le fichier est-il protégé par mot de passe ?
    * - true : Afficher un formulaire de mot de passe au client
    * - false : Permettre le téléchargement directement
    *
    * Sécurité : Le mot de passe n'est JAMAIS retourné (pas même hashé)
    * Validation du mot de passe : Côté serveur uniquement (PUT /download)
    */
   has_password: boolean
}

