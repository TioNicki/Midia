
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Loader2 } from "lucide-react"

/**
 * Rota raiz do aplicativo.
 * Redireciona usuários logados para o dashboard e não logados para o login,
 * removendo a landing page anterior conforme solicitado.
 */
export default function RootPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, isUserLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Carregando Atos Multimídia...</p>
      </div>
    </div>
  )
}
