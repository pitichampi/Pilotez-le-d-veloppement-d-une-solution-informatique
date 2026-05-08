import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@utils/cn'

/**
 * Props du composant Input
 * Étend les propriétés HTML standard des champs de saisie
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Classes CSS supplémentaires */
  className?: string
}

/**
 * Composant Input réutilisable
 *
 * Utilise forwardRef pour permettre l'accès au DOM (contrôle direct du champ)
 * Fournit :
 * - Bordure grise avec focus orange
 * - Hauteur et padding standard
 * - États désactivé et placeholder
 *
 * @example
 * const inputRef = useRef<HTMLInputElement>(null)
 * <Input ref={inputRef} type="email" placeholder="Email" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-10 w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-base placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:border-orange-warm focus:ring-2 focus:ring-orange-warm focus:ring-opacity-20 focus:bg-cream-light disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
