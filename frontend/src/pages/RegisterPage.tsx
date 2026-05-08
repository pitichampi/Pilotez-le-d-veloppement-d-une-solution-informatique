import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, RegisterRequest } from '@api/index'
import { useAuth } from '@hooks/useAuth'
import { GlobalLayout } from '@components/GlobalLayout'
import { Card } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Alert, AlertDescription } from '@components/ui/Alert'
import { Loader } from '@components/ui/Loader'

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
 */
export const RegisterPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const deriveUsername = (value: string) => {
    const local = value.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '')
    if (local.length >= 3) return local.slice(0, 50)
    const fallback = value.replace(/[^a-zA-Z0-9]/g, '')
    return fallback.length >= 3 ? fallback.slice(0, 50) : `user${Math.floor(Math.random() * 9000) + 1000}`
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    const username = deriveUsername(email)

    try {
      const response = await authApi.register({ email, username, password } as RegisterRequest)
      login(response.data.token, response.data.user)
      navigate('/')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de l\'enregistrement'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <GlobalLayout
      gradient={true}
      showLoginButton={true}
    >
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg">
          <Card className="shadow-soft">
            <div className="bg-white px-10 py-12 rounded-[30px]">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-semibold text-slate-950">Créer un compte</h1>
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

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                  Verification du mot de passe
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Saisissez le à nouveau"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-orange-warm hover:text-orange-600"
                >
                  J'ai déjà un compte
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
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
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