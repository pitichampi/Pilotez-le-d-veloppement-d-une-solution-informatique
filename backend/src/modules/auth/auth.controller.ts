import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto'
import { JwtGuard } from '@common/guards/jwt.guard'

/**
 * Contrôleur d'authentification (AuthController)
 * Gère l'enregistrement, la connexion et le profil utilisateur
 *
 * Endpoints :
 * - POST /api/auth/register → Créer un compte
 * - POST /api/auth/login → Se connecter
 * - GET /api/auth/me → Récupérer le profil courant (protégé JWT)
 * - POST /api/auth/logout → Déconnexion (stateless, juste pour le client)
 *
 * Sécurité :
 * - Passwords jamais retournés (exclus des DTOs)
 * - JWT généré après authentification réussie (stateless)
 * - /api/auth/me protégé par JwtGuard
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Enregistre un nouvel utilisateur (US03)
   *
   * POST /api/auth/register
   *
   * Body (RegisterDto) :
   * {
   *   "email": "alice@example.com",
   *   "username": "alice",
   *   "password": "SecurePass123!"
   * }
   *
   * Réponse 201 (AuthResponseDto) :
   * {
   *   "token": "eyJhbGciOi...",
   *   "user": { "id": "uuid", "email": "alice@example.com", "username": "alice", "createdAt": "2025-04-29T..." }
   * }
   *
   * Erreurs :
   * - 409 EMAIL_TAKEN : Email déjà enregistré
   * - 422 : Validation échouée (email/password invalides)
   *
   * @param registerDto { email, username, password }
   * @returns AuthResponseDto avec JWT et profil utilisateur
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto)
  }

  /**
   * Authentifie un utilisateur existant (US04)
   *
   * POST /api/auth/login
   *
   * Body (LoginDto) :
   * {
   *   "email": "alice@example.com",
   *   "password": "SecurePass123!"
   * }
   *
   * Réponse 200 (AuthResponseDto) :
   * {
   *   "token": "eyJhbGciOi...",
   *   "user": { "id": "uuid", "email": "alice@example.com", "username": "alice", "createdAt": "2025-04-29T..." }
   * }
   *
   * Erreurs :
   * - 401 INVALID_CREDENTIALS : Email ou mot de passe incorrect
   * - 422 : Validation échouée (format invalide)
   *
   * @param loginDto { email, password }
   * @returns AuthResponseDto avec JWT et profil utilisateur
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto)
  }

  /**
   * Récupère le profil de l'utilisateur courant
   * Endpoint protégé par JWT
   *
   * GET /api/auth/me
   * Headers : Authorization: Bearer {jwt}
   *
   * Réponse 200 :
   * {
   *   "id": "uuid",
   *   "email": "alice@example.com"
   * }
   *
   * Erreurs :
   * - 401 UNAUTHORIZED : JWT manquant ou invalide
   *
   * @param req Request Express avec req.user = { sub: userId, email }
   * @returns Profil utilisateur (id, email)
   */
  @Get('me')
  @UseGuards(JwtGuard)
  async me(@Req() req: any) {
    return {
      id: req.user.sub,
      email: req.user.email,
    }
  }

  /**
   * Déconnexion de l'utilisateur
   * Endpoint stateless (pas de session côté serveur)
   * Le client supprime simplement le JWT du localStorage
   *
   * POST /api/auth/logout
   *
   * Réponse 200 :
   * { "message": "Logged out successfully" }
   *
   * ⚠️ Note : En stateless, cette méthode est optionnelle
   * Le client peut simplement supprimer son JWT localement
   */
  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' }
  }
}

