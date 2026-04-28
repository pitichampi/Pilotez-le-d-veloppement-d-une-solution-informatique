import { ReactNode } from 'react'
import { cn } from '@utils/cn'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

interface AlertProps {
  children: ReactNode
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  className?: string
}

export function Alert({ children, variant = 'default', className }: AlertProps) {
  const variantClasses = {
    default: "border-blue-200 bg-blue-50 text-blue-800",
    destructive: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800"
  }

  const icons = {
    default: Info,
    destructive: XCircle,
    success: CheckCircle,
    warning: AlertTriangle
  }

  const Icon = icons[variant]

  return (
    <div className={cn(
      "flex items-start space-x-3 rounded-md border p-4",
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

interface AlertDescriptionProps {
  children: ReactNode
  className?: string
}

export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return (
    <div className={cn("text-sm", className)}>
      {children}
    </div>
  )
}
