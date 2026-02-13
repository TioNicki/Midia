
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Church } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = (e: React.FormEvent, role: "admin" | "member") => {
    e.preventDefault()
    login(role)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[url('https://picsum.photos/seed/faithflow1/1920/1080')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-none">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-full">
              <Church className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline text-primary">FaithFlow</CardTitle>
          <CardDescription>Gerencie a mídia da sua igreja com excelência</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full h-11 text-lg font-bold" onClick={(e) => handleLogin(e, "admin")}>
            Entrar como Admin
          </Button>
          <Button variant="outline" className="w-full h-11 text-lg" onClick={(e) => handleLogin(e, "member")}>
            Entrar como Membro
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            FaithFlow &copy; {new Date().getFullYear()} - Grupo de Mídia
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
