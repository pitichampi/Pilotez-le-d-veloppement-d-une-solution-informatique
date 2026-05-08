import { ReactNode } from 'react'
import { cn } from '@utils/cn'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

/**
 * Props du composant Alert
 */
interface AlertProps {
  /** Contenu de l'alerte (peut être HTML) */
  children: ReactNode

  /** Type d'alerte déterminant la couleur et l'icône */
  variant?: 'default' | 'destructive' | 'success' | 'warning'

  /** Classes CSS supplémentaires */
  className?: string
}

/**
 * Composant Alert réutilisable
 *
 * Variants :
 * - default : Info (bleu)
 * - destructive : Erreur (rouge)
 * - success : Succès (vert)
 * - warning : Attention (jaune)
 *
 * Chaque variant inclut une icône appropriée
 *
 * @example
 * <Alert variant="destructive">
 *   <AlertDescription>Une erreur est survenue</AlertDescription>
 * </Alert>
 */
export function Alert({ children, variant = 'default', className }: AlertProps) {
  // Classes de couleur selon le variant
  // Harmonisé avec design Figma : rouge pour erreurs, vert pour succès
  const variantClasses = {
    default: "border-blue-200 bg-blue-50 text-blue-900 border-l-4 border-l-blue-500",
    destructive: "border-error-light bg-error-light text-error-primary border-l-4 border-l-error-bright",
    success: "border-green-200 bg-green-50 text-green-900 border-l-4 border-l-green-500",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900 border-l-4 border-l-yellow-500"
  }

  // Icônes associées à chaque variant
  const icons = {
    default: Info,
    destructive: XCircle,
    success: CheckCircle,
    warning: AlertTriangle
  }

  const Icon = icons[variant]

  return (
    <div className={cn(
      "flex items-start space-x-3 rounded-lg border px-4 py-3 shadow-sm",
      variantClasses[variant],
      className
    )}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

/**
 * Props du composant AlertDescription
 */
interface AlertDescriptionProps {
  /** Contenu textuel de la description */
  children: ReactNode

  /** Classes CSS supplémentaires */
  className?: string
}

/**
 * Composant AlertDescription
 * Sous-composant d'Alert pour le contenu textuel
 * Formate le texte en petite taille
 *
 * @example
 * <Alert variant="success">
 *   <AlertDescription>Opération réussie</AlertDescription>
 * </Alert>
 */
export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return (
    <div className={cn("text-sm", className)}>
      {children}
    </div>
  )
}
