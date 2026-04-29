import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

/**
 * Garde JWT pour la protection des routes authentifiées
 *
 * Responsabilités :
 * - Extrait le JWT du header Authorization (format: "Bearer {token}")
 * - Valide la signature et l'expiration du token
 * - Attache le payload décodé à req.user pour utilisation dans les contrôleurs
 * - Rejette les requêtes sans JWT ou avec un token invalide
 *
 * Utilisation :
 * @UseGuards(JwtGuard) sur les routes protégées
 * Le payload décodé contient : { sub (userId), email, iat, exp }
 */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  /**
   * Vérifie la validité du JWT dans la requête HTTP
   *
   * Flux :
   * 1. Extraire le header Authorization
   * 2. Valider le format "Bearer {token}"
   * 3. Vérifier la signature JWT avec JwtService
   * 4. Attacher le payload à req.user
   * 5. Retourner true pour autoriser, ou lancer UnauthorizedException
   *
   * @param context Contexte d'exécution NestJS (accès à la requête HTTP)
   * @returns true si le JWT est valide, lève UnauthorizedException sinon
   * @throws UnauthorizedException si Authorization header manquant, invalide ou token expiré
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    // Vérifier que le header Authorization est présent
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header')
    }

    // Extraire le token du format "Bearer {token}"
    const token = authHeader.replace('Bearer ', '')
    try {
      // Vérifier la signature et l'expiration du JWT
      const payload = this.jwtService.verify(token)
      // Attacher les données utilisateur à la requête pour usage dans le contrôleur
      request.user = payload
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }
}

