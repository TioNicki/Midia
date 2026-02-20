
"use client"

import * as React from "react"
import { 
  CalendarDays, 
  Music, 
  Bell, 
  MessageSquare, 
  LayoutDashboard, 
  LogOut,
  User,
  ShieldCheck,
  Users,
  Crown,
  Briefcase,
  Sun,
  Moon,
  Circle,
  Pencil,
  Loader2,
  Lock
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { signOut, updateProfile, updateEmail, updatePassword } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { formatShortName } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { differenceInDays } from "date-fns"

const baseMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Escalas", icon: CalendarDays, path: "/dashboard/escalas" },
  { title: "Louvores", icon: Music, path: "/dashboard/louvores" },
  { title: "Datas Importantes", icon: Bell, path: "/dashboard/eventos" },
  { title: "Feedback", icon: MessageSquare, path: "/dashboard/feedback" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const firestore = useFirestore()
  const { setOpenMobile } = useSidebar()
  const { toast } = useToast()
  
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  
  // Profile state
  const [editData, setEditData] = React.useState({ name: "", email: "", password: "" })

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'
  const isModerator = profile?.role === 'moderator'

  const handleLogout = async () => {
    await signOut(auth)
    setOpenMobile(false)
    router.push("/login")
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setOpenMobile(false)
  }

  const handleOpenProfile = () => {
    if (profile) {
      setEditData({ name: profile.name, email: profile.email, password: "" })
      setIsProfileOpen(true)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    // Check 15-day limit
    const lastUpdate = profile.lastProfileUpdate ? new Date(profile.lastProfileUpdate) : null
    if (lastUpdate) {
      const daysPassed = differenceInDays(new Date(), lastUpdate)
      if (daysPassed < 15) {
        toast({ 
          variant: "destructive", 
          title: "Limite de tempo", 
          description: `Você alterou seu perfil recentemente. Aguarde mais ${15 - daysPassed} dias para alterar novamente.` 
        })
        return
      }
    }

    setIsUpdating(true)
    try {
      // Update Name in Auth and Firestore
      if (editData.name !== profile.name) {
        await updateProfile(user, { displayName: editData.name })
        await updateDoc(doc(firestore, 'app_users', user.uid), { 
          name: editData.name,
          lastProfileUpdate: new Date().toISOString()
        })
      }

      // Update Email
      if (editData.email !== profile.email) {
        await updateEmail(user, editData.email)
        await updateDoc(doc(firestore, 'app_users', user.uid), { email: editData.email })
      }

      // Update Password
      if (editData.password) {
        await updatePassword(user, editData.password)
      }

      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas com sucesso." })
      setIsProfileOpen(false)
    } catch (error: any) {
      console.error(error)
      let msg = "Erro ao atualizar perfil."
      if (error.code === 'auth/requires-recent-login') {
        msg = "Para alterar e-mail ou senha, você precisa ter feito login recentemente. Saia e entre novamente."
      }
      toast({ variant: "destructive", title: "Erro", description: msg })
    } finally {
      setIsUpdating(false)
    }
  }

  const menuItems = [...baseMenuItems]
  
  if (isAdminOrHigher) {
    menuItems.push({ title: "Usuários", icon: Users, path: "/dashboard/usuarios" })
    menuItems.push({ title: "Funções", icon: Briefcase, path: "/dashboard/funcoes" })
  }

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent" onClick={() => handleNavigation("/")}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Music className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sidebar-foreground">Atos Multimídia</span>
                  <div className="flex items-center gap-1.5">
                    <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500 animate-pulse" />
                    <span className="text-[10px] opacity-70">Sistema Online 24h</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.path}
                  tooltip={item.title}
                  onClick={() => handleNavigation(item.path)}
                  className="my-1 py-6"
                >
                  <button>
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.title}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <SidebarSeparator className="mb-4 opacity-20" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleTheme} tooltip="Alternar Tema" className="mb-2">
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleOpenProfile} 
                className="flex items-center gap-3 px-2 py-8 mb-4 overflow-hidden bg-sidebar-accent/10 hover:bg-sidebar-accent/20 rounded-lg transition-colors"
                tooltip="Meu Perfil"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20">
                  {isModerator ? <Crown className="h-5 w-5 text-amber-500" /> : isAdminOrHigher ? <ShieldCheck className="h-5 w-5 text-accent" /> : <User className="h-5 w-5 text-white" />}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-sm font-bold truncate text-sidebar-foreground">
                    {formatShortName(profile?.name || user?.displayName || user?.email?.split('@')[0])}
                  </span>
                  <span className="text-[10px] opacity-70 truncate uppercase tracking-tighter">
                    {isModerator ? "Moderador" : isAdminOrHigher ? "Administrador" : "Membro Voluntário"}
                  </span>
                  <span className="text-[10px] text-primary flex items-center gap-1 mt-0.5 group-data-[collapsible=icon]:hidden">
                    <Pencil className="h-2 w-2" /> Editar Perfil
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
            <DialogDescription>
              Mantenha seus dados atualizados. Lembre-se: o nome só pode ser alterado a cada 15 dias.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prof-name">Nome Completo</Label>
              <Input 
                id="prof-name" 
                value={editData.name} 
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                placeholder="Seu nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-email">E-mail</Label>
              <Input 
                id="prof-email" 
                type="email"
                value={editData.email} 
                onChange={(e) => setEditData({...editData, email: e.target.value})}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-pass">Nova Senha (deixe vazio para não alterar)</Label>
              <div className="relative">
                <Input 
                  id="prof-pass" 
                  type="password"
                  value={editData.password} 
                  onChange={(e) => setEditData({...editData, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
              </div>
            </div>
            {profile?.lastProfileUpdate && (
              <p className="text-[10px] text-muted-foreground italic bg-muted/30 p-2 rounded">
                Última alteração de nome em: {new Date(profile.lastProfileUpdate).toLocaleDateString('pt-BR')}
              </p>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)} disabled={isUpdating}>Cancelar</Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
