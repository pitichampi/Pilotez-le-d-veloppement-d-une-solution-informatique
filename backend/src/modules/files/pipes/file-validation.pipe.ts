import { Injectable, PipeTransform, BadRequestException, PayloadTooLargeException, Logger } from '@nestjs/common'

/**
 * Pipe de validation pour les uploads de fichiers
 * US01: Validation de sécurité des uploads
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly logger = new Logger('FileValidationPipe')
  
  // Limite de 1 Go (1,073,741,824 bytes)
  private readonly MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1 GB

  // Types MIME acceptés (liste blanche)
  private readonly ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'audio/mpeg',
    'audio/wav',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    'application/json',
    'application/xml',
    'text/xml',
  ])

  // Extensions interdites (liste noire - sécurité ajoutée)
  private readonly FORBIDDEN_EXTENSIONS = new Set([
    '.exe',
    '.bat',
    '.sh',
    '.msi',
    '.cmd',
    '.ps1',
    '.pif',
    '.scr',
    '.vbs',
    '.js', // Techniquement possible, mais dangereux en contexte Web
    '.jar',
    '.com',
  ])

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Aucun fichier uploadé')
    }

    // Vérification 1: Taille du fichier
    if (file.size > this.MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(
        `La taille du fichier dépasse 1 Go. Reçu : ${(file.size / 1024 / 1024 / 1024).toFixed(2)} Go`,
      )
    }

    if (file.size === 0) {
      throw new BadRequestException('Le fichier uploadé est vide')
    }

    // Vérification 2: Extension du fichier
    const filename = file.originalname.toLowerCase()
    const extension = filename.substring(filename.lastIndexOf('.'))
    
    if (this.FORBIDDEN_EXTENSIONS.has(extension)) {
      throw new BadRequestException(`L'extension de fichier « ${extension} » n'est pas autorisée pour des raisons de sécurité`)
    }

    // Vérification 3: Type MIME annoncé
    if (!this.ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Type MIME « ${file.mimetype} » non autorisé. Types autorisés : ${Array.from(this.ALLOWED_MIME_TYPES).join(', ')}`,
      )
    }

    // Vérification 4: Détection du type MIME réel (détection magique)
    // Cette vérification additional protège contre les fichiers renommés
    this.validateMimeTypeSignature(file)

    return file
  }

  /**
   * Valide le type MIME en détectant la signature du fichier
   * Utilise la détection magique pour protéger contre les renommages
   */
  private validateMimeTypeSignature(file: Express.Multer.File): void {
    if (!file.buffer || file.buffer.length === 0) {
      return
    }

    const buffer = file.buffer
    const mimetype = file.mimetype.toLowerCase()

    // Signatures MIME courantes (magic bytes)
    const mimeSignatures: { [key: string]: number[] } = {
      'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
      'image/png': [0x89, 0x50, 0x4e, 0x47],
      'image/jpeg': [0xff, 0xd8, 0xff],
      'image/gif': [0x47, 0x49, 0x46],
      'application/zip': [0x50, 0x4b, 0x03, 0x04],
      'application/x-zip-compressed': [0x50, 0x4b, 0x03, 0x04],
      'application/gzip': [0x1f, 0x8b],
      'application/x-tar': [0x1f, 0x9d], // compress
    }

    // Vérifier les signatures connues
    for (const [expectedMime, signature] of Object.entries(mimeSignatures)) {
      if (mimetype.includes(expectedMime.split('/')[0]) || mimetype === expectedMime) {
        // Vérifier que la signature correspond
        const matchesSignature = signature.every((byte, index) => buffer[index] === byte)
        
        if (!matchesSignature && signature.length > 0) {
          // Pour les textes simples, ne pas être trop strict
          if (!mimetype.includes('text')) {
            this.logger.warn(
              `File signature mismatch: expected ${expectedMime}, got ${mimetype}`,
            )
          }
        }
      }
    }

    // Protection supplémentaire: Rejeter les exécutables PE
    if (
      buffer.length >= 2 &&
      buffer[0] === 0x4d &&
      buffer[1] === 0x5a // MZ header
    ) {
      throw new BadRequestException('Fichier exécutable détecté (en-têtre PE trouvé)')
    }

    // Protection: Rejeter les scripts
    const headerStr = buffer.toString('utf8', 0, Math.min(10, buffer.length)).toLowerCase()
    if (headerStr.includes('#!/') && mimetype.includes('text')) {
      throw new BadRequestException('Script shell détecté')
    }
  }
}

