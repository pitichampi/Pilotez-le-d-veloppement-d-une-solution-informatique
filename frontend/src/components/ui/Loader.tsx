import { cn } from '@utils/cn'

/**
 * Props du composant Loader
 */
interface LoaderProps {
  /** Taille du spinner */
  size?: 'sm' | 'md' | 'lg'

  /** Classes CSS supplémentaires */
  className?: string
}

/**
 * Composant Loader (spinner) réutilisable
 *
 * Affiche un indicateur de chargement animé
 * Utilise TailwindCSS (animate-spin) et une bordure orange sur le haut
 *
 * Sizes :
 * - sm : Petit (4x4 rem) - Pour les boutons
 * - md : Normal (6x6 rem) - Défaut
 * - lg : Grand (8x8 rem) - Pour les pages
 *
 * @example
 * <Loader size="lg" />
 * <Button><Loader size="sm" className="mr-2" /> Chargement...</Button>
 */
export function Loader({ size = 'md', className }: LoaderProps) {
  // Tailles du spinner selon le contexte
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-gray-300 border-t-orange-600",
      sizeClasses[size],
      className
    )}
    />
  )
}
