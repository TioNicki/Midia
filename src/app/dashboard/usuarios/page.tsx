
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Shield, ShieldAlert, Loader2, Trash2, Mail, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function UsuariosPage() {
  const firestore = useFirestore()
  const { user: currentUser } = useUser()
  const { toast } = useToast()

  const userProfileRef = useMemoFirebase(() => 
    currentUser ? doc(firestore, 'app_users', currentUser.uid) : null, 
    [firestore, currentUser]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isModerator = profile?.role === 'moderator'
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const usersRef = useMemoFirebase(() => 
    isAdminOrHigher ? collection(firestore, 'app_users') : null, 
    [firestore, isAdminOrHigher]
  )
  const { data: users, isLoading } = useCollection(usersRef)

  const handleApprove = (userId: string) => {
    if (!isModerator) return
    const userRef = doc(firestore, 'app_users', userId)
    updateDocumentNonBlocking(userRef, { status: 'approved' })
    toast({ title: "Usuário aprovado", description: "O acesso foi liberado com sucesso." })
  }

  const handleToggleRole = (userId: string, currentRole: string) => {
    if (!isModerator) {
      toast({ variant: "destructive", title: "Ação negada", description: "Apenas moderadores podem alterar cargos." })
      return
    }
    if (userId === currentUser?.uid) {
      toast({ variant: "destructive", title: "Ação negada", description: "Você não pode remover seu próprio poder." })
      return
    }

    const userRef = doc(firestore, 'app_users', userId)
    let newRole = 'member'
    if (currentRole === 'member') newRole = 'admin'
    else if (currentRole === 'admin') newRole = 'moderator'
    else if (currentRole === 'moderator') newRole = 'member'
    
    updateDocumentNonBlocking(userRef, { role: newRole })
    toast({ title: "Função alterada", description: `Usuário agora é ${newRole}.` })
  }

  const handleDelete = (userId: string) => {
    if (!isModerator) return
    if (userId === currentUser?.uid) {
      toast({ variant: "destructive", title: "Ação negada", description: "Você não pode remover a si mesmo." })
      return
    }
    
    if (confirm("Tem certeza que deseja remover este usuário permanentemente?")) {
      const userRef = doc(firestore, 'app_users', userId)
      deleteDocumentNonBlocking(userRef)
      toast({ title: "Usuário removido", description: "O perfil foi excluído do banco de dados." })
    }
  }

  if (!isAdminOrHigher && profile) {
    return <div className="p-8 text-center text-muted-foreground">Acesso negado. Apenas administradores ou moderadores podem ver esta página.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Gestão de Usuários</h2>
          <p className="text-muted-foreground">Controle quem tem acesso ao sistema e suas permissões.</p>
        </div>
        {!isModerator && (
          <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">
            Modo Visualização (Somente Moderador altera cargos)
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe FaithFlow</CardTitle>
          <CardDescription>Lista completa de voluntários, administradores e moderadores.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id} className={u.id === currentUser?.uid ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.name}
                        {u.id === currentUser?.uid && <Badge variant="secondary" className="text-[10px] h-4">Você</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {u.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {u.role === 'moderator' && <Crown className="h-3 w-3 text-amber-500" />}
                        <Badge variant={u.role === 'moderator' ? "default" : u.role === 'admin' ? "secondary" : "outline"}>
                          {u.role === 'moderator' ? 'Moderador' : u.role === 'admin' ? 'Administrador' : 'Membro'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'approved' ? "outline" : "destructive"}>
                        {u.status === 'approved' ? 'Aprovado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isModerator && u.id !== currentUser?.uid && (
                          <>
                            {u.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-green-600 h-8 w-8" 
                                onClick={() => handleApprove(u.id)}
                                title="Aprovar Usuário"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-primary h-8 w-8" 
                              onClick={() => handleToggleRole(u.id, u.role)}
                              title="Ciclar Função (Membro -> Admin -> Moderador)"
                            >
                              {u.role === 'moderator' ? <Crown className="h-4 w-4" /> : u.role === 'admin' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive h-8 w-8" 
                              onClick={() => handleDelete(u.id)}
                              title="Remover Usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isModerator && u.id !== currentUser?.uid && (
                          <span className="text-xs text-muted-foreground italic">Restrito</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
