
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
  Circle
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc } from "firebase/firestore"

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
  
  const [theme, setTheme] = React.useState<"light" | "dark">("light")

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

  const menuItems = [...baseMenuItems]
  
  if (isAdminOrHigher) {
    menuItems.push({ title: "Usuários", icon: Users, path: "/dashboard/usuarios" })
    menuItems.push({ title: "Funções", icon: Briefcase, path: "/dashboard/funcoes" })
  }

  return (
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
            <div className="flex items-center gap-3 px-2 py-2 mb-4 overflow-hidden group-data-[collapsible=icon]:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/20">
                {isModerator ? <Crown className="h-5 w-5 text-amber-500" /> : isAdminOrHigher ? <ShieldCheck className="h-5 w-5 text-accent" /> : <User className="h-5 w-5 text-white" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{profile?.name || user?.email?.split('@')[0]}</span>
                <span className="text-xs opacity-70 truncate">
                  {isModerator ? "Moderador" : isAdminOrHigher ? "Administrador" : "Membro"}
                </span>
              </div>
            </div>
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
  )
}
