import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, RegisterRequest } from '@api/index'
import { useAuth } from '@hooks/useAuth'
import { Card } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Alert, AlertDescription } from '@components/ui/Alert'
import { Loader } from '@components/ui/Loader'
import { UserPlus } from 'lucide-react'

/**
 * Page d'inscription utilisateur (US03)
 *
 * Fonctionnalités :
 * - Formulaire d'inscription (email/password)
 * - Validation des champs côté client
 * - Appel API d'enregistrement
 * - Stockage du JWT et redirection vers accueil
 * - Gestion des erreurs d'enregistrement
 * - Design harmonisé avec palette orange/crème
 *
 * Validations :
 * - Email unique (erreur 409 EMAIL_TAKEN)
 * - Mot de passe minimum 8 caractères
 *
 * Flux :
 * 1. Utilisateur rentre email et password
 * 2. Validation basique des champs
 * 3. Appel POST /auth/register
 * 4. Si succès : stocker JWT, stocker user, rediriger vers /
 * 5. Si erreur : afficher le message d'erreur
 */
export const RegisterPage = () => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  /**
   * Validation des champs côté client
   */
  const validateForm = (): boolean => {
    setError('')

    if (!email.trim()) {
      setError('L\'adresse email est requise')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Veuillez entrer une adresse email valide')
      return false
    }

    if (!username.trim()) {
      setError('Le nom d\'utilisateur est requis')
      return false
    }

    if (username.length < 3) {
      setError('Le nom d\'utilisateur doit contenir au moins 3 caractères')
      return false
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }

    return true
  }

  /**
   * Gère la soumission du formulaire
   *
   * @param e React form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Appel API d'enregistrement (US03)
      const response = await authApi.register({ email, username, password } as RegisterRequest)

      // Stocker le JWT et les données utilisateur dans le contexte
      login(response.data.token, response.data.user)

      // Rediriger vers la page d'accueil
      navigate('/')
    } catch (err: any) {
      // Afficher l'erreur retournée par l'API ou un message générique
      const message = err.response?.data?.message || 'Erreur lors de l\'enregistrement'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <UserPlus className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inscription</h1>
          <p className="text-gray-600">Créez votre compte DataShare</p>
        </div>

        {/* Card du formulaire */}
        <Card className="p-8">
          {/* Affichage des erreurs */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Formulaire */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Champ email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Champ nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur (minimum 3 caractères)
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Mon pseudo"
                required
                disabled={isLoading}
              />
            </div>

            {/* Champ mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe (minimum 8 caractères)
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {/* Champ confirmation mot de passe */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {/* Bouton de soumission */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Création du compte en cours...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  S'inscrire
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Lien vers la connexion */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-orange-600 hover:text-orange-700 underline-offset-4 hover:underline"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}



