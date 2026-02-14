
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
  Users
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
  const { auth } = useAuth()
  const { user } = useUser()
  const { firestore } = useFirestore()

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdmin = profile?.role === 'admin'

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const menuItems = isAdmin 
    ? [...baseMenuItems, { title: "Usuários", icon: Users, path: "/dashboard/usuarios" }]
    : baseMenuItems

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Music className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">FaithFlow</span>
                <span className="text-xs opacity-70">Church Media</span>
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
                onClick={() => router.push(item.path)}
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
            <div className="flex items-center gap-3 px-2 py-2 mb-4 overflow-hidden group-data-[collapsible=icon]:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/20">
                {isAdmin ? <ShieldCheck className="h-5 w-5 text-accent" /> : <User className="h-5 w-5 text-white" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{profile?.name || user?.email?.split('@')[0]}</span>
                <span className="text-xs opacity-70 truncate">{isAdmin ? "Administrador" : "Membro"}</span>
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
