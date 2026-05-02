
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Church, Loader2, UserPlus, LogIn, ShieldPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [churchName, setChurchName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
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
      await signInWithEmailAndPassword(auth, email, password)
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." })
      router.push("/dashboard")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao entrar", description: "Verifique suas credenciais." })
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    const cleanCode = inviteCode.trim().toUpperCase()
    if (!name || !email || !password || !cleanCode) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos, incluindo o código de convite." })
      return
    }
    
    setLoading(true)

    try {
      // 1. Validar Código de Convite de forma estrita
      const q = query(collection(firestore, 'media_groups'), where('inviteCode', '==', cleanCode))
      const snap = await getDocs(q)
      
      if (snap.empty) {
        throw new Error("Código de convite inválido ou não encontrado. Verifique com seu coordenador.")
      }
      
      const targetGroup = snap.docs[0].data()
      const groupId = snap.docs[0].id

      // 2. Criar Usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid
      await updateProfile(userCredential.user, { displayName: name })

      // 3. Criar Perfil vinculado ao grupo encontrado
      await setDoc(doc(firestore, 'app_users', uid), {
        id: uid,
        groupId: groupId,
        externalAuthId: uid,
        name: name,
        email: email,
        role: 'member',
        status: 'pending',
        createdAt: new Date().toISOString()
      })

      toast({ 
        title: "Solicitação enviada!", 
        description: `Você foi vinculado ao grupo ${targetGroup.name}. Aguarde a aprovação.` 
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no cadastro", description: error.message })
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!churchName || !name || !email || !password) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos para criar o grupo." })
      return
    }
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid
      await updateProfile(userCredential.user, { displayName: name })

      // Gerar código baseado no primeiro nome do grupo
      const firstWord = churchName.trim().split(/\s+/)[0].toUpperCase()
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
      
      // Caso especial para Atos Multimídia principal
      const isMainAtos = churchName.toLowerCase().includes("atos") && churchName.toLowerCase().includes("multimídia")
      const generatedCode = isMainAtos ? "ATOS-SM05" : `${firstWord}-${randomSuffix}`
      
      const groupsRef = collection(firestore, 'media_groups')
      const newGroupDoc = doc(groupsRef)
      const groupId = newGroupDoc.id

      await setDoc(newGroupDoc, {
        id: groupId,
        name: churchName,
        inviteCode: generatedCode,
        ownerId: uid,
        createdAt: new Date().toISOString()
      })

      await setDoc(doc(firestore, 'app_users', uid), {
        id: uid,
        groupId: groupId,
        externalAuthId: uid,
        name: name,
        email: email,
        role: 'moderator',
        status: 'approved',
        createdAt: new Date().toISOString()
      })

      toast({ title: "Grupo criado com sucesso!", description: `Seu código de convite é: ${generatedCode}` })
      router.push("/dashboard")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar grupo", description: error.message })
      setLoading(false)
    }
  }

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[url('https://picsum.photos/seed/atos-tenant/1920/1080')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-none">
        <CardHeader className="text-center">
          <Church className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle className="text-3xl font-headline text-primary">Atos Multimídia</CardTitle>
          <CardDescription>Gestão de Mídia para Igrejas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Membro</TabsTrigger>
              <TabsTrigger value="group">Nova Igreja</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button className="w-full h-11" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" /> Entrar</>}</Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>Código de Convite</Label>
                  <Input placeholder="Ex: IGREJA-XXXX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
                  <p className="text-[10px] text-muted-foreground italic">Solicite o código oficial ao seu coordenador.</p>
                </div>
                <div className="space-y-2"><Label>Nome Completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button className="w-full h-11" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" /> Solicitar Acesso</>}</Button>
              </form>
            </TabsContent>

            <TabsContent value="group">
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2"><Label>Nome da Igreja / Grupo</Label><Input placeholder="Ex: Igreja Batista Central" value={churchName} onChange={(e) => setChurchName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Seu Nome (Administrador)</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button className="w-full h-11" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <><ShieldPlus className="mr-2 h-4 w-4" /> Criar Painel</>}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
