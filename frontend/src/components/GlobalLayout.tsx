import { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

interface GlobalLayoutProps {
  children: ReactNode
  showLoginButton?: boolean
  gradient?: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  loginButtonText?: string
}

/**
 * Layout global avec header et footer constants
 * - Header : DataShare logo + boutons (Login ou Logout)
 * - Footer : Copyright 2026
 * - Utilisé par toutes les pages
 */
export const GlobalLayout = ({
  children,
  showLoginButton = false,
  gradient = false,
  hideHeader = false,
  hideFooter = false,
  loginButtonText = 'Se connecter'
}: GlobalLayoutProps) => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: gradient 
          ? "linear-gradient(174.89deg, rgb(255, 184, 140) 2.29%, rgb(222, 98, 98) 97.72%)"
          : undefined,
        backgroundColor: !gradient ? '#f3eeea' : undefined
      }}
    >
      {!hideHeader && <Header showLoginButton={showLoginButton} loginButtonText={loginButtonText} />}

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  )
}
