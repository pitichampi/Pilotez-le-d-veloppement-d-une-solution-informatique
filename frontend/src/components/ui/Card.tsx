import { ReactNode } from 'react'
import { cn } from '@utils/cn'

/**
 * Props du composant Card
 */
interface CardProps {
  /** Contenu du composant Card */
  children: ReactNode

  /** Classes CSS supplémentaires */
  className?: string
}

/**
 * Composant Card réutilisable
 *
 * Fournit une boîte conteneur avec :
 * - Fond blanc
 * - Bordure grise légère
 * - Coins arrondis
 * - Ombre subtile
 *
 * @example
 * <Card>
 *   <div>Contenu de la carte</div>
 * </Card>
 */
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 shadow-sm",
      className
    )}>
      {children}
    </div>
  )
}
