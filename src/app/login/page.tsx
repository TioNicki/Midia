
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Church, Loader2, UserPlus, LogIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  
  const auth = useAuth()
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // RECUPERAÇÃO AUTOMÁTICA: Força o cargo de Moderador no Firestore ao logar
      // Isso garante que você nunca fique "trancado" fora do seu próprio app.
      const userRef = doc(firestore, 'app_users', userCredential.user.uid)
      await setDoc(userRef, {
        id: userCredential.user.uid,
        externalAuthId: userCredential.user.uid,
        name: userCredential.user.displayName || email.split('@')[0],
        email: email,
        role: 'moderator',
        status: 'approved'
      }, { merge: true })

      toast({ title: "Bem-vindo!", description: "Acesso de Moderador restaurado." })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: "Verifique suas credenciais.",
      })
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    if (!name || !email || !password) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Preencha todos os campos." })
      return
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Senha curta", description: "A senha deve ter no mínimo 6 caracteres." })
      return
    }
    
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      await updateProfile(userCredential.user, { displayName: name })

      const userRef = doc(firestore, 'app_users', uid)
      await setDoc(userRef, {
        id: uid,
        externalAuthId: uid,
        name: name,
        email: email,
        role: 'moderator',
        status: 'approved'
      })

      toast({
        title: "Conta de Moderador criada!",
        description: "Você agora tem acesso total.",
      })
      
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Erro no cadastro:", error)
      let message = "Ocorreu um erro inesperado."
      if (error.code === 'auth/email-already-in-use') {
        message = "Este e-mail já está em uso."
      }

      toast({ variant: "destructive", title: "Erro ao criar conta", description: message })
      setLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[url('https://picsum.photos/seed/faithflow1/1920/1080')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
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
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button className="w-full h-11 text-lg font-bold" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><LogIn className="mr-2 h-5 w-5" /> Entrar</>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nome Completo</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="Seu nome" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">E-mail</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button className="w-full h-11 text-lg font-bold" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><UserPlus className="mr-2 h-5 w-5" /> Criar Conta de Moderador</>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-xs text-center text-muted-foreground mt-2">
            FaithFlow &copy; {new Date().getFullYear()} - Grupo de Mídia
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
