import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, LoginRequest } from '@api/index'
import { useAuth } from '@hooks/useAuth'

/**
 * Page de connexion utilisateur (US04)
 *
 * Fonctionnalités :
 * - Formulaire de connexion (email/password)
 * - Validation des champs côté client
 * - Appel API d'authentification
 * - Stockage du JWT et redirection vers accueil
 * - Gestion des erreurs d'authentification
 *
 * Flux :
 * 1. Utilisateur rentre email et password
 * 2. Validation basique des champs
 * 3. Appel POST /auth/login
 * 4. Si succès : stocker JWT, stocker user, rediriger vers /
 * 5. Si erreur : afficher le message d'erreur
 */
export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  /**
   * Gère la soumission du formulaire
   *
   * @param e React form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Appel API de connexion (US04)
      const response = await authApi.login({ email, password } as LoginRequest)

      // Stocker le JWT et les données utilisateur dans le contexte
      login(response.data.token, response.data.user)

      // Rediriger vers la page d'accueil
      navigate('/')
    } catch (err: any) {
      // Afficher l'erreur retournée par l'API ou un message générique
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* En-tête */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Connexion</h2>
        </div>

        {/* Formulaire */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Affichage des erreurs */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          )}

          {/* Champs du formulaire */}
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Champ email */}
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>

            {/* Champ mot de passe */}
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
              />
            </div>
          </div>

          {/* Bouton de soumission */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

