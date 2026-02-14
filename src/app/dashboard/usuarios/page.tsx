
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserCheck, UserX, Shield, ShieldAlert, Loader2, Trash2, Mail } from "lucide-react"
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
  const isAdmin = profile?.role === 'admin'

  // Só tenta buscar a coleção de usuários se o perfil atual for carregado e confirmado como admin
  const usersRef = useMemoFirebase(() => 
    isAdmin ? collection(firestore, 'app_users') : null, 
    [firestore, isAdmin]
  )
  const { data: users, isLoading } = useCollection(usersRef)

  const handleApprove = (userId: string) => {
    const userRef = doc(firestore, 'app_users', userId)
    updateDocumentNonBlocking(userRef, { status: 'approved' })
    toast({ title: "Usuário aprovado", description: "O acesso foi liberado com sucesso." })
  }

  const handleToggleRole = (userId: string, currentRole: string) => {
    const userRef = doc(firestore, 'app_users', userId)
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    updateDocumentNonBlocking(userRef, { role: newRole })
    toast({ title: "Função alterada", description: `Usuário agora é ${newRole}.` })
  }

  const handleDelete = (userId: string) => {
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

  if (!isAdmin && profile) {
    return <div className="p-8 text-center text-muted-foreground">Acesso negado. Apenas administradores podem gerenciar usuários.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Gestão de Usuários</h2>
        <p className="text-muted-foreground">Controle quem tem acesso ao sistema e suas permissões.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe FaithFlow</CardTitle>
          <CardDescription>Lista completa de voluntários e coordenadores cadastrados.</CardDescription>
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
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {u.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? "default" : "secondary"}>
                        {u.role === 'admin' ? 'Administrador' : 'Membro'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'approved' ? "outline" : "destructive"}>
                        {u.status === 'approved' ? 'Aprovado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                          title="Alternar Função"
                        >
                          {u.role === 'admin' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (!users || users.length === 0) && (
                   <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
