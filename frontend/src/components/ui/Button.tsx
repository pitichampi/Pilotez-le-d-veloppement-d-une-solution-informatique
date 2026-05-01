import { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@utils/cn'

/**
 * Props du composant Button
 * Étend les propriétés HTML standard des boutons
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Contenu du bouton */
  children: ReactNode

  /** Style visuel du bouton */
  variant?: 'default' | 'outline' | 'ghost' | 'link'

  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg'

  /** Classes CSS supplémentaires */
  className?: string
}

/**
 * Composant Button réutilisable
 *
 * Variants :
 * - default : Bouton primaire avec fond orange
 * - outline : Bouton secondaire avec bordure grise
 * - ghost : Bouton sans bordure, transparent
 * - link : Texte souligné (style lien)
 *
 * Sizes :
 * - sm : Petit bouton (8px height)
 * - md : Taille normale (10px height)
 * - lg : Grand bouton (12px height)
 *
 * @example
 * <Button variant="default" size="lg">Valider</Button>
 * <Button variant="outline">Annuler</Button>
 */
export function Button({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  // Classes de base communes à tous les boutons
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  // Classes spécifiques selon le variant
  const variantClasses = {
    default: "bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100",
    ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
    link: "text-orange-600 underline-offset-4 hover:underline"
  }

  // Classes spécifiques selon la taille
  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-8 text-lg"
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
