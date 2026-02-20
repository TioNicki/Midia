import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Retorna o primeiro e segundo nome de uma string completa.
 * @param fullName Nome completo
 * @returns Nome formatado
 */
export function formatShortName(fullName: string | null | undefined): string {
  if (!fullName) return "Usuário"
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return fullName
  return `${parts[0]} ${parts[1]}`
}
