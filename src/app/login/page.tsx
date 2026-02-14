
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
  
  const { auth } = useAuth()
  const { firestore } = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: "Verifique suas credenciais.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Preencha todos os campos." })
      return
    }
    
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      await updateProfile(userCredential.user, { displayName: name })

      const userRef = doc(firestore, 'app_users', uid)
      
      // Criando o perfil como ADMIN e APROVADO para facilitar o setup inicial
      await setDoc(userRef, {
        id: uid,
        externalAuthId: uid,
        name: name,
        email: email,
        role: 'admin',
        status: 'approved'
      })

      toast({
        title: "Conta de Administrador criada!",
        description: "Você já pode acessar o painel de controle.",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
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
                  />
                </div>
                <Button className="w-full h-11 text-lg font-bold" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><UserPlus className="mr-2 h-5 w-5" /> Criar Conta Admin</>}
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
