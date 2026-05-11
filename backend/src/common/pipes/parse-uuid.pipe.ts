import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common'

/**
 * Pipe personnalisée pour valider les UUIDs.
 * Si la valeur n'est pas un UUID valide, rejette avec NotFoundException (404)
 * pour que le service n'essaie pas de requêter la BDD avec un UUID invalide.
 */
@Injectable()
export class ParseUuidPipe implements PipeTransform {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  transform(value: any) {
    if (!this.uuidRegex.test(value)) {
      // Rejeter avec 404 au lieu de 400 pour les UUIDs invalides
      throw new NotFoundException(`Ressource introuvable`)
    }
    return value
  }
}



