/**
 * DTO pour l'élément de liste des fichiers (US05)
 * Retourné dans GET /api/files
 * Contient les métadonnées essentielles pour l'historique
 *
 * Utilisation :
 * - Afficher la liste des fichiers de l'utilisateur
 * - Générer les liens de téléchargement
 * - Montrer le statut (expiré, protégé)
 */
export class FileListItemDto {
  /**
   * UUID du fichier en base de données
   * Utilisé pour les opérations protégées (DELETE /api/files/{id})
   */
  id: string

  /**
   * Token d'accès public unique (UUID v4)
   * Utilisé pour accéder au fichier sans authentification
   */
  token: string

  /**
   * URL complète de téléchargement public
   * Format : http://localhost:3000/d/{token}
   */
  download_url: string

  /**
   * Nom original fourni par le client
   * Affiché dans la liste et au téléchargement
   */
  original_name: string

  /**
   * Taille en bytes du fichier
   */
  size_bytes: number

  /**
   * Type MIME du fichier
   */
  mime_type: string

  /**
   * Date d'expiration du lien
   * null si pas d'expiration
   */
  expires_at: Date | null

  /**
   * Indique si le fichier est protégé par mot de passe
   */
  has_password: boolean

  /**
   * Tags optionnels pour organiser les fichiers
   */
  tags: string[]
}
