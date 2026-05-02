
"use client"

import * as React from "react"
import { CalendarDays, Music, Bell, MessageSquare, LayoutDashboard, LogOut, User, ShieldCheck, Users, Crown, Briefcase, Sun, Moon, Circle, Pencil, Loader2, Lock, ArrowLeftRight, Copy, Church } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { signOut, updateProfile, updateEmail, updatePassword } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { formatShortName } from "@/lib/utils"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar } from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'app_users', user.uid) : null, [firestore, user])
  const { data: profile } = useDoc(userProfileRef)
  
  const groupRef = useMemoFirebase(() => profile?.groupId ? doc(firestore, 'media_groups', profile.groupId) : null, [firestore, profile?.groupId])
  const { data: group } = useDoc(groupRef)

  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'
  const isModerator = profile?.role === 'moderator'

  const copyInvite = () => {
    if (!group?.inviteCode) return
    navigator.clipboard.writeText(group.inviteCode)
    toast({ title: "Código copiado!", description: "Envie para os novos membros." })
  }

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "Escalas", icon: CalendarDays, path: "/dashboard/escalas" },
    { title: "Louvores", icon: Music, path: "/dashboard/louvores" },
    { title: "Datas Importantes", icon: Bell, path: "/dashboard/eventos" },
    { title: "Feedback", icon: MessageSquare, path: "/dashboard/feedback" },
  ]
  
  if (isAdminOrHigher) {
    menuItems.push({ title: "Trocas", icon: ArrowLeftRight, path: "/dashboard/trocas" })
    menuItems.push({ title: "Usuários", icon: Users, path: "/dashboard/usuarios" })
    menuItems.push({ title: "Funções", icon: Briefcase, path: "/dashboard/funcoes" })
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent" onClick={() => router.push("/dashboard")}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-white"><Church className="size-4" /></div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sidebar-foreground truncate">{group?.name || 'Carregando...'}</span>
                <span className="text-[10px] opacity-70">Painel Administrativo</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.path} onClick={() => router.push(item.path)} className="py-6">
                <button><item.icon className="h-5 w-5" /><span className="text-base">{item.title}</span></button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        {isAdminOrHigher && group && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-2 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-bold text-primary uppercase">Código de Convite</p>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono font-bold">{group.inviteCode}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyInvite}><Copy className="h-3 w-3" /></Button>
            </div>
          </div>
        )}
        <SidebarSeparator className="opacity-20" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut(auth).then(() => router.push("/login"))} className="text-red-400">
              <LogOut className="h-5 w-5" /><span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
