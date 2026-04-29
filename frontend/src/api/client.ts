import axios from 'axios'

/**
 * URL de base de l'API backend
 * Configurée via variable d'environnement VITE_API_URL ou défaut localhost:3001
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Instance Axios centralisée pour toutes les requêtes API
 *
 * Configuration :
 * - Base URL : API_BASE_URL
 * - Content-Type par défaut : application/json
 * - Intercepteurs : Authentification JWT et gestion d'erreurs
 *
 * Intercepteurs :
 * 1. Request : Ajoute le JWT aux headers Authorization
 * 2. Response : Gère les erreurs 401 (redirection /login)
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Intercepteur de requête
 *
 * Responsabilité :
 * - Récupérer le JWT du localStorage
 * - L'ajouter au header Authorization (format: "Bearer {token}")
 * - Transmettre toutes les requêtes authentifiées
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Intercepteur de réponse
 *
 * Responsabilité :
 * - Capturer les erreurs 401 (token expiré/invalide)
 * - Supprimer le JWT du localStorage
 * - Rediriger l'utilisateur vers la page de connexion
 * - Propager les autres erreurs normalement
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gestion des réponses 401 (non authentifié/token expiré)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
