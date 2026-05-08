import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@components/ui/Button'
import { LogOut } from 'lucide-react'

interface HeaderProps {
  showLoginButton?: boolean
  loginButtonText?: string
}

export const Header = ({
  showLoginButton = false,
  loginButtonText = 'Se connecter'
}: HeaderProps) => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const headerButtonClassName = 'bg-slate-950 text-white border-transparent hover:bg-slate-800'

  return (
    <header className="flex items-center justify-between px-8 h-[72px] bg-transparent">
      <div
        className="text-2xl font-bold text-black cursor-pointer"
        onClick={() => navigate('/')}
      >
        DataShare
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <span className="text-sm text-gray-700 font-medium">{user?.email}</span>
            <Button
              onClick={handleLogout}
              variant="default"
              size="sm"
              className={headerButtonClassName}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </>
        ) : showLoginButton ? (
          <Button
            onClick={() => navigate(loginButtonText === 'Créer un compte' ? '/register' : '/login')}
            variant="default"
            size="md"
            className={headerButtonClassName}
          >
            {loginButtonText}
          </Button>
        ) : null}
      </div>
    </header>
  )
}
