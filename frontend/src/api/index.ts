import api from './client'

/**
 * Interface utilisateur (US03/04)
 * Propriétés retournées après authentification
 */
export interface User {
  id: string
  email: string
  username: string
  createdAt: Date
}

/**
 * DTO de requête pour connexion (US04)
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * DTO de réponse pour connexion/enregistrement (US03/04)
 * Contient le JWT et les données utilisateur
 */
export interface LoginResponse {
  token: string
  user: User
}

/**
 * DTO de requête pour enregistrement (US03)
 */
export interface RegisterRequest {
  email: string
  username: string
  password: string
}

/**
 * Namespace d'API pour l'authentification
 *
 * Endpoints :
 * - POST /auth/login → Connexion utilisateur
 * - POST /auth/register → Enregistrement nouvel utilisateur
 * - POST /auth/logout → Déconnexion (stateless)
 * - GET /auth/me → Récupérer le profil courant
 *
 * US03/04 : Authentification et gestion de compte
 */
export const authApi = {
  /**
   * Connecte un utilisateur existant
   * @param data Identifiants (email, password)
   * @returns Réponse avec JWT et données utilisateur
   */
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),

  /**
   * Enregistre un nouvel utilisateur
   * @param data Données d'inscription (email, username, password)
   * @returns Réponse avec JWT et données utilisateur
   */
  register: (data: RegisterRequest) => api.post<LoginResponse>('/auth/register', data),

  /**
   * Déconnecte l'utilisateur courant
   * Note : Stateless, effectue juste un logout côté serveur
   */
  logout: () => api.post('/auth/logout'),

  /**
   * Récupère le profil de l'utilisateur authentifié
   * Nécessite un JWT valide
   * @returns Données utilisateur courant (id, email)
   */
  me: () => api.get<User>('/auth/me'),
}

/**
 * Namespace d'API pour la gestion des utilisateurs
 */
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  update: (id: string, data: Partial<User>) => api.patch<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

/**
 * Namespace d'API pour la gestion des fichiers
 *
 * Endpoints :
 * - GET /files → Récupérer l'historique utilisateur (US05)
 * - POST /files/upload → Uploader un fichier (US01/07)
 * - DELETE /files/{id} → Supprimer un fichier (US06)
 * - GET /files/{id}/download → Télécharger son fichier
 * - GET /files/share/{token}/metadata → Récupérer métadonnées publiques (US02)
 * - POST /files/share/{token}/download → Télécharger via lien public (US02)
 *
 * Sécurité :
 * - Upload protégé par JWT (utilisateur authentifié)
 * - Téléchargement public via token UUID unique
 * - Mots de passe optionnels hashés Bcrypt (US09)
 * - Expiration 1-7 jours (US10)
 */
export const filesApi = {
  /**
   * Récupère l'historique des fichiers de l'utilisateur (US05)
   * Endpoint protégé JWT
   * @returns Liste des fichiers de l'utilisateur
   */
  getAll: () => api.get('/files'),

   /**
    * Uploader un fichier (US01/07)
    * Endpoint protégé JWT
    *
    * Contraintes :
    * - Taille max 1 Go
    * - Extensions interdites : .exe, .bat, .sh, .msi, .cmd, .ps1
    * - Type MIME validé côté serveur
    * - Tags optionnels (max 30 chars par tag)
    * - Mot de passe optionnel (min 6 chars, hashé Bcrypt)
    * - Expiration optionnelle (1-7 jours, défaut 7)
    *
    * @param file Fichier à uploader
    * @param expirationDays Durée de vie du lien en jours (1-7, optionnel)
    * @param password Mot de passe de protection optionnel (min 6 chars)
    * @param tags Tags optionnels pour organiser le fichier
    * @returns Réponse avec token d'accès public et URL de partage
    */
   upload: (file: File, expirationDays?: number, password?: string, tags?: string[]) => {
     const formData = new FormData()
     formData.append('file', file)
     if (expirationDays) {
       formData.append('expirationDays', String(expirationDays))
     }
     if (password) {
       formData.append('filePassword', password)
     }
     if (tags && tags.length > 0) {
       // Envoyer les tags comme JSON stringifiés pour la compatibilité avec NestJS/class-transformer
       formData.append('tags', JSON.stringify(tags))
     }
     return api.post('/files/upload', formData, {
       headers: {
         'Content-Type': 'multipart/form-data',
       },
     })
   },

  /**
   * Supprime un fichier (US06)
   * Endpoint protégé JWT - Propriétaire uniquement
   * Suppression irréversible du fichier et de ses métadonnées
   *
   * @param id UUID du fichier
   */
  delete: (id: string) => api.delete(`/files/${id}`),

  /**
   * Télécharge son propre fichier
   * Endpoint protégé JWT
   *
   * @param id UUID du fichier
   * @returns Stream binaire du fichier
   */
  download: (id: string) => api.get(`/files/${id}/download`, {
    responseType: 'blob',
  }),

  /**
   * Récupère les métadonnées d'un fichier avant téléchargement (US02)
   * Endpoint PUBLIC (pas d'authentification)
   *
   * Métadonnées accessibles :
   * - Nom original du fichier
   * - Taille en bytes
   * - Type MIME
   * - Date de création
   * - Date d'expiration
   * - Statut protection par mot de passe
   *
   * @param token UUID du fichier (uploadToken)
   * @returns Métadonnées publiques
   */
  getMetadata: (token: string) => api.get(`/files/share/${token}/metadata`),

  /**
   * Télécharge un fichier via lien public (US02)
   * Endpoint PUBLIC avec validation optionnelle du mot de passe
   *
   * Sécurité :
   * - Token UUID unique valide 24h à 7 jours
   * - Mot de passe optionnel transmis en POST (pas en URL)
   * - Comparaison bcrypt côté serveur
   *
   * @param token UUID du fichier (uploadToken)
   * @param password Mot de passe du fichier (optionnel, requis si filePasswordHash présent)
   * @returns Stream binaire du fichier
   */
  downloadPublic: (token: string, password?: string) => api.post(`/files/share/${token}/download`, { password }, {
    responseType: 'blob',
  }),
}

/**
 * Helper pour récupérer les métadonnées d'un fichier partagé
 * Enveloppe filesApi.getMetadata() pour accès simplifié
 *
 * @param token UUID du fichier partagé
 * @returns Métadonnées publiques du fichier
 */
export const getFileMetadata = async (token: string) => {
  const response = await filesApi.getMetadata(token)
  return response.data
}

/**
 * Helper pour télécharger un fichier via lien public
 * Enveloppe filesApi.downloadPublic() pour accès simplifié
 *
 * @param token UUID du fichier partagé
 * @param password Mot de passe optionnel du fichier
 * @returns Response Axios avec le contenu binaire
 */
export const downloadFile = async (token: string, password?: string) => {
  return filesApi.downloadPublic(token, password)
}

