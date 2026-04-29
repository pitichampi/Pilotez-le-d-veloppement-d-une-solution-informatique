import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { User } from '@api/index'
import api from '@api/client'

/**
 * Contexte d'authentification
 * Expose l'état utilisateur et les méthodes de connexion/déconnexion
 */
interface AuthContextType {
  /** Données utilisateur courant (null si non authentifié) */
  user: User | null
  /** Indicateur d'authentification (true si JWT valide) */
  isAuthenticated: boolean
  /** Fonction de connexion - stocke le JWT et les données utilisateur */
  login: (token: string, user: User) => void
  /** Fonction de déconnexion - supprime le JWT et réinitialise l'état */
  logout: () => void
  /** Indicateur de chargement initial (vérification du JWT existant) */
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Fournisseur de contexte d'authentification
 *
 * Responsabilités :
 * - Gérer l'état global d'authentification (useContext pattern)
 * - Vérifier le JWT stocké au montage du composant
 * - Fournir les méthodes login/logout à tous les composants enfants
 * - Valider le token auprès du serveur (/auth/me)
 *
 * Flux d'initialisation :
 * 1. Vérifier si un JWT existe dans localStorage
 * 2. Si oui, appeler /auth/me pour valider et récupérer les données
 * 3. Si valide, stocker les données utilisateur dans l'état
 * 4. Si invalide, supprimer le JWT du localStorage
 * 5. Terminer le chargement
 *
 * @param children Composants enfants à envelopper
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Vérifie le JWT existant au montage du composant
   * Appelé une seule fois au chargement initial de l'app
   */
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Token présent → valider auprès du serveur
      api
        .get('/auth/me')
        .then((res) => setUser(res.data))
        // Token invalide ou expiré → le supprimer
        .catch(() => localStorage.removeItem('token'))
        // Toujours terminer le chargement
        .finally(() => setIsLoading(false))
    } else {
      // Pas de token → initialisation terminée
      setIsLoading(false)
    }
  }, [])

  /**
   * Connecte l'utilisateur
   * Stocke le JWT dans localStorage et met à jour l'état utilisateur
   *
   * @param token JWT à stocker
   * @param userData Données utilisateur retournées par l'API
   */
  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  /**
   * Déconnecte l'utilisateur
   * Supprime le JWT du localStorage et réinitialise l'état utilisateur
   */
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // Fournir le contexte à tous les enfants
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte d'authentification
 *
 * Utilisation :
 * ```
 * const { user, isAuthenticated, login, logout } = useAuth()
 * ```
 *
 * @returns État et méthodes d'authentification
 * @throws Error si appelé en dehors du AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

