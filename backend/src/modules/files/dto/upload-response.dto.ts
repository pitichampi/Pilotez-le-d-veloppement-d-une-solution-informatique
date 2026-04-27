/**
 * DTO pour la réponse d'upload
 * Retourne les métadonnées du fichier uploadé et le token d'accès
 */
export class UploadResponseDto {
  id: string
  uploadToken: string
  name: string
  originalName: string
  size: number
  mimetype: string
  createdAt: Date
  expiresAt?: Date
  tags?: string[]
}

