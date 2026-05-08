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
  // Harmonisé avec le design Figma : orange-warm primaire, transitions fluides
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-warm focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed"

  // Classes spécifiques selon le variant
  // default: Orange warm (#e27f29) avec états hover/active
  // outline: Bordure grise légère, fonds doux
  // ghost: Transparent, texte gris
  // link: Texte orange avec underline
  const variantClasses = {
    default: "bg-orange-warm text-white hover:bg-orange-accent active:bg-orange-500 shadow-md hover:shadow-lg",
    outline: "border-2 border-gray-300 bg-white text-neutral-dark hover:bg-cream-light active:bg-gray-100 transition-colors",
    ghost: "text-neutral-medium hover:bg-cream-light active:bg-gray-200 transition-colors",
    link: "text-orange-warm underline-offset-4 hover:text-orange-accent hover:underline transition-colors"
  }

  // Classes spécifiques selon la taille
  // Cohérent avec hiérarchie typographique Figma
  const sizeClasses = {
    sm: "h-8 px-3 text-sm font-medium",
    md: "h-10 px-4 py-2 text-base",
    lg: "h-12 px-6 text-base font-semibold"
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
