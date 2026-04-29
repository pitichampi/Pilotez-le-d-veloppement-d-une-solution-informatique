import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utilitaire pour fusionner les classes CSS
 *
 * Combine clsx (gestion des classes conditionnelles) et twMerge (résolution des conflits Tailwind)
 *
 * Avantages :
 * - Évite les conflits de spécificité Tailwind (ex: bg-red-600 + bg-blue-600)
 * - Accepte les structures conditionnelles
 * - Simplifie la composition de classes
 *
 * @param inputs Classes à fusionner (strings, arrays, objets)
 * @returns String de classes CSS fusionnées et optimisées
 *
 * @example
 * // Fusion simple
 * cn("px-2", "py-1") // → "px-2 py-1"
 *
 * // Résolution des conflits Tailwind
 * cn("bg-red-600", "bg-blue-600") // → "bg-blue-600" (le dernier gagne)
 *
 * // Conditionnels
 * cn("text-gray-900", isActive && "font-bold", isError && "text-red-600")
 *
 * // Objets conditionnels
 * cn({
 *   "text-gray-900": true,
 *   "font-bold": isActive,
 *   "text-red-600": isError
 * })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
