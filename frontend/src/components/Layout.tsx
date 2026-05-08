import { ReactNode } from 'react'
import { GlobalLayout } from '@components/GlobalLayout'

interface LayoutProps {
  /**
   * Contenu de la page à envelopper
   */
  children: ReactNode
  /**
   * Afficher le gradient orange/coral en background
   */
  gradient?: boolean
}

/**
 * Layout pour les pages authentifiées
 * Enveloppe le contenu avec GlobalLayout (header + footer)
 * Fond crème clair ou gradient orange selon configuration
 */
export const Layout = ({ children, gradient = false }: LayoutProps) => {
  return (
    <GlobalLayout gradient={gradient} hideHeader={true} hideFooter={true}>
      <main className={`flex-1 flex items-stretch ${gradient ? 'w-full' : 'mx-auto w-full'}`}>
        {children}
      </main>
    </GlobalLayout>
  )
}

