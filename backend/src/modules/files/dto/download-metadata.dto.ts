/**
 * DTO pour retourner les métadonnées d'un fichier avant téléchargement
 * US02: Download - Les métadonnées du fichier sont visibles avant téléchargement
 */
export class DownloadMetadataDto {
  id: string
  uploadToken: string
  originalName: string
  size: number
  mimetype: string
  createdAt: Date
  expiresAt?: Date
  isPasswordProtected: boolean
}

