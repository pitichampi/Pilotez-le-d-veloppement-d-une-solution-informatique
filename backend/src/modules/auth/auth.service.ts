import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '@modules/users/users.service'
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto'

/**
 * Service d'authentification (AuthService)
 * Gère l'enregistrement des utilisateurs et la connexion
 * US03/04 : Inscription avec email unique, connexion avec JWT
 *
 * Processus de sécurité :
 * 1. Mot de passe hashé avec Bcrypt (cost 10) avant stockage
 * 2. JWT généré après authentification réussie (stateless)
 * 3. Validation email unique au moment de l'enregistrement
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Enregistre un nouvel utilisateur (US03)
   * Valide que l'email n'existe pas déjà, puis crée l'utilisateur
   *
   * @param registerDto { email, password, username }
   * @returns AuthResponseDto { token, user }
   * @throws BadRequestException si email déjà enregistré
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email)
    if (existingUser) {
      throw new BadRequestException('Email déjà enregistré')
    }

    /**
     * Hash du mot de passe avec Bcrypt
     * - Cost 10 : balance entre sécurité et performance
     * - Le mot de passe en clair n'est jamais stocké en BD
     */
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)
    const user = await this.usersService.create({
      email: registerDto.email,
      username: registerDto.username,
      password: hashedPassword,
    })

    const token = this.generateToken(user.id, user.email)
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    }
  }

  /**
   * Authentifie un utilisateur et génère un JWT (US04)
   * Vérifie l'email et valide le mot de passe avec Bcrypt
   *
   * @param loginDto { email, password }
   * @returns AuthResponseDto { token, user }
   * @throws UnauthorizedException si email/password invalides
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email)
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides')
    }

    /**
     * Comparaison du mot de passe fourni avec le hash stocké
     * bcrypt.compare gère automatiquement le salting et la comparaison sécurisée
     */
    const passwordMatch = await bcrypt.compare(loginDto.password, user.password)
    if (!passwordMatch) {
      throw new UnauthorizedException('Identifiants invalides')
    }

    const token = this.generateToken(user.id, user.email)
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    }
  }

  /**
   * Valide un JWT et retourne ses données
   * Utilisé par la stratégie Passport JWT pour extraire l'utilisateur
   *
   * @param token JWT à valider
   * @returns Payload du token { sub (userId), email }
   * @throws UnauthorizedException si token invalide/expiré
   */
  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token)
    } catch (error) {
      throw new UnauthorizedException('Token invalide')
    }
  }

  /**
   * Génère un JWT pour l'utilisateur
   * Le token contient l'ID utilisateur (sub) et l'email
   * Utilisé pour l'authentification stateless (pas de session)
   *
   * @param userId ID UUID de l'utilisateur
   * @param email Email de l'utilisateur
   * @returns JWT signé
   * @private
   */
  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
    )
  }
}

