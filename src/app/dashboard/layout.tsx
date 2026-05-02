
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, AlertCircle, LogOut, ShieldAlert } from "lucide-react"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  const [isMigrating, setIsMigrating] = useState(false)

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)

  const groupRef = useMemoFirebase(() => 
    profile?.groupId ? doc(firestore, 'media_groups', profile.groupId) : null,
    [firestore, profile?.groupId]
  )
  const { data: group } = useDoc(groupRef)

  // Lógica de migração para o grupo principal ATOS-SM05
  useEffect(() => {
    async function migrateLegacyUser() {
      if (user && profile && !profile.groupId && !isMigrating) {
        setIsMigrating(true)
        try {
          // Busca ou cria o grupo ATOS-SM05
          const groupsRef = collection(firestore, 'media_groups')
          const q = query(groupsRef, where('inviteCode', '==', 'ATOS-SM05'))
          const querySnapshot = await getDocs(q)
          
          let targetGroupId = ""
          
          if (querySnapshot.empty) {
            // Cria o grupo padrão se não existir
            const newGroupRef = doc(groupsRef)
            targetGroupId = newGroupRef.id
            await setDoc(newGroupRef, {
              id: targetGroupId,
              name: "Atos Multimídia",
              inviteCode: "ATOS-SM05",
              ownerId: user.uid,
              createdAt: new Date().toISOString()
            })
          } else {
            targetGroupId = querySnapshot.docs[0].id
          }

          // Atualiza o perfil do usuário
          await updateDoc(doc(firestore, 'app_users', user.uid), {
            groupId: targetGroupId
          })
          
          window.location.reload() // Recarrega para aplicar o novo groupId
        } catch (error) {
          console.error("Migration error:", error)
        } finally {
          setIsMigrating(false)
        }
      }
    }

    migrateLegacyUser()
  }, [user, profile, firestore, isMigrating])

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login")
  }, [user, isUserLoading, router])

  if (isUserLoading || isProfileLoading || isMigrating) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          {isMigrating && <p className="text-sm text-muted-foreground animate-pulse">Sincronizando seu perfil com o grupo ATOS-SM05...</p>}
        </div>
      </div>
    )
  }

  if (!user) return null

  if (!profile) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-6">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-3xl font-bold">Acesso Revogado</h1>
          <p className="text-muted-foreground">Sua conta não possui um perfil ativo ou grupo vinculado.</p>
          <Button onClick={() => signOut(auth).then(() => router.push("/login"))}><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </div>
      </div>
    )
  }

  if (profile.status !== 'approved') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h1 className="text-3xl font-bold">Aguardando Aprovação</h1>
          <p className="text-muted-foreground">Sua conta no grupo <strong>{group?.name || '...'}</strong> aguarda liberação da liderança.</p>
          <p className="text-sm font-mono bg-muted p-2 rounded">Convite: {group?.inviteCode || 'ATOS-SM05'}</p>
          <Button variant="outline" onClick={() => signOut(auth).then(() => router.push("/login"))}><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-headline font-semibold text-primary">{group?.name || 'Atos Multimídia'}</h1>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
