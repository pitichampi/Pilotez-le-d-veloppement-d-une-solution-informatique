/**
 * DTO pour la réponse d'upload (US01)
 * Retourné après POST /api/files/upload
 * Contient le token d'accès public et les métadonnées du fichier
 *
 * Utilisation :
 * 1. Récupérer uploadToken → Générer lien public
 * 2. Afficher originalName, size, createdAt dans l'historique
 * 3. Montrer expiresAt pour informer l'utilisateur
 *
 * @author DataShare Team
 * @version 1.0.0
 */
export class UploadResponseDto {
  /**
   * UUID du fichier en base de données
   * Utilisé pour les opérations protégées (DELETE /api/files/{id})
   */
  id: string

  /**
   * Token d'accès public unique (UUID v4)
   * Utilisé pour accéder au fichier sans authentification
   * Lien public : /api/files/share/{uploadToken}/metadata
   * Téléchargement : POST /api/files/share/{uploadToken}/download
   */
  uploadToken: string

  /**
   * Lien de téléchargement public complet
   * Format : http://localhost:3000/d/{uploadToken}
   * Peut être partagé sans authentification
   */
  download_url?: string

  /**
   * Nom interne du fichier (UUID-originale.pdf)
   * Évite les collisions si plusieurs uploads du même nom
   */
  name: string

  /**
   * Nom original fourni par le client
   * Affiché au téléchargement (Content-Disposition: attachment; filename=...)
   * Exemple : "rapport-Q1.pdf"
   */
  originalName: string

  /**
   * Taille en bytes du fichier uploadé
   * Validation : max 1 Go (1024 * 1024 * 1024 bytes)
   * Exemple : 204800 → 200 KB
   */
  size: number

  /**
   * Type MIME détecté du fichier
   * Exemple : "application/pdf", "image/png", "text/csv"
   * Validé lors de l'upload (whitelist de types autorisés)
   */
  mimetype: string

  /**
   * Date de création (upload réussi)
   * Format ISO 8601 UTC (2025-04-28T10:30:00Z)
   */
  createdAt: Date

  /**
   * Date d'expiration du lien (US10)
   * Optional : null si aucune expiration
   * Format ISO 8601 UTC
   * Valeurs possibles : now + 1 à 7 jours
   * Purge automatique via Cron quotidienne à minuit UTC
   */
  expiresAt?: Date

  /**
   * Indicateur : fichier protégé par mot de passe (US09)
   * true si filePassword fourni lors de l'upload
   * false sinon
   */
  has_password?: boolean

  /**
   * Tags optionnels pour organiser les fichiers
   * Tableau de strings (0-N tags)
   * Chaque tag max 30 caractères
   * Dédoublonnés automatiquement
   */
  tags?: string[]
}

