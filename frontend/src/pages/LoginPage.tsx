import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, LoginRequest } from '@api/index'
import { useAuth } from '@hooks/useAuth'
import { GlobalLayout } from '@components/GlobalLayout'
import { Card } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Alert, AlertDescription } from '@components/ui/Alert'
import { Loader } from '@components/ui/Loader'

/**
 * Page de connexion utilisateur (US04)
 *
 * Fonctionnalités :
 * - Formulaire de connexion (email/password)
 * - Validation des champs côté client
 * - Appel API d'authentification
 * - Stockage du JWT et redirection vers accueil
 * - Gestion des erreurs d'authentification
 * - Design harmonisé avec palette orange/crème
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
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authApi.login({ email, password } as LoginRequest)
      login(response.data.token, response.data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <GlobalLayout
      gradient={true}
      showLoginButton={true}
      loginButtonText="Créer un compte"
    >
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg">
          <Card className="shadow-soft">
            <div className="bg-white px-10 py-12 rounded-[30px]">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-semibold text-slate-950">Connexion</h1>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Saisissez votre email..."
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Mot de passe
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe..."
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-sm font-medium text-orange-warm hover:text-orange-600"
                  >
                    Créer un compte
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full border-orange-warm bg-orange-50 text-orange-warm hover:bg-orange-100"
                  variant="outline"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Connexion...
                    </>
                  ) : (
                    'Connexion'
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </GlobalLayout>
  )
}

