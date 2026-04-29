import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

interface ProtectedRouteProps {
  /**
   * Contenu à afficher si l'utilisateur est authentifié
   */
  children: ReactNode
}

/**
 * Composant de route protégée (HOC)
 * 
 * Responsabilités :
 * - Vérifier l'authentification de l'utilisateur (JWT présent et valide)
 * - Afficher un écran de chargement pendant la vérification du token
 * - Rediriger vers /login si l'utilisateur n'est pas authentifié
 * - Afficher le contenu protégé si l'utilisateur est authentifié
 * 
 * Utilisation :
 * ```
 * <ProtectedRoute>
 *   <MonComposantProtege />
 * </ProtectedRoute>
 * ```
 * 
 * Flux :
 * 1. Récupérer l'état d'authentification du contexte useAuth
 * 2. Si chargement en cours → afficher spinner
 * 3. Si non authentifié → rediriger vers /login
 * 4. Si authentifié → afficher les enfants
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Afficher un spinner pendant la vérification du JWT stocké
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    )
  }

  // Rediriger vers login si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Afficher le contenu protégé
  return <>{children}</>
}

