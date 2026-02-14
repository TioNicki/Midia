
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2, AlertCircle, LogOut } from "lucide-react"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const { firestore } = useFirestore()
  const { auth } = useAuth()
  const router = useRouter()

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  // Check if account is approved
  if (profile && profile.status !== 'approved') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="bg-amber-100 p-4 rounded-full w-fit mx-auto">
            <AlertCircle className="h-12 w-12 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Aguardando Aprovação</h1>
          <p className="text-muted-foreground">
            Sua conta (<strong>{profile.email}</strong>) foi criada com sucesso, mas ainda não foi aprovada por um administrador.
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, entre em contato com a liderança do grupo de mídia para liberar seu acesso.
          </p>
          <div className="pt-6">
            <Button variant="outline" onClick={() => signOut(auth).then(() => router.push("/login"))}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-headline font-semibold text-primary">FaithFlow Media</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Dashboard / Painel Geral
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
