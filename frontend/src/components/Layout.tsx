import { ReactNode } from 'react'
import { useAuth } from '@hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@components/ui/Button'
import { LogOut } from 'lucide-react'

interface LayoutProps {
  /**
   * Contenu de la page à envelopper
   */
  children: ReactNode
}

/**
 * Composant Layout (mise en page générale)
 *
 * Fournit :
 * - En-tête avec barre de navigation cohérente au design
 * - Affichage du nom d'utilisateur connecté
 * - Bouton de déconnexion stylisé
 * - Conteneur principal avec fond crème/dégradé orange
 *
 * Utilisé par toutes les pages protégées
 */
export const Layout = ({ children }: LayoutProps) => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  /**
   * Gère la déconnexion de l'utilisateur
   *
   * Flux :
   * 1. Appeler logout() du contexte (supprime JWT du localStorage)
   * 2. Rediriger vers /login
   */
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* En-tête avec barre de navigation */}
      <header className="bg-white shadow-sm border-b border-orange-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo/Titre */}
          <div className="text-2xl font-bold text-orange-600">DataShare</div>

          {/* Section droite : Email et bouton déconnexion */}
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              {/* Affichage de l'email de l'utilisateur */}
              <span className="text-sm text-gray-600">{user?.email}</span>

              {/* Bouton déconnexion */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                title="Déconnecte l'utilisateur et redirige vers /login"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          )}
        </nav>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

