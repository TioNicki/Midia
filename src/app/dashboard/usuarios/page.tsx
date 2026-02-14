
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Shield, ShieldAlert, Loader2, Trash2, Mail, Crown, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function UsuariosPage() {
  const firestore = useFirestore()
  const { user: currentUser } = useUser()
  const { toast } = useToast()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)

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
      toast({ variant: "destructive", title: "Ação negada", description: "Você não pode alterar seu próprio poder por aqui para evitar erros." })
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

  const confirmDelete = () => {
    if (!idToDelete || !isModerator) return
    if (idToDelete === currentUser?.uid) return

    const userRef = doc(firestore, 'app_users', idToDelete)
    deleteDocumentNonBlocking(userRef)
    toast({ title: "Usuário removido", variant: "destructive" })
    setIdToDelete(null)
    setIsDeleteDialogOpen(false)
  }

  if (!isAdminOrHigher && profile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold">Acesso Negado</h3>
        <p className="text-muted-foreground">Apenas administradores ou moderadores podem ver esta página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Gestão de Usuários</h2>
          <p className="text-muted-foreground">Controle quem tem acesso ao sistema e suas permissões.</p>
        </div>
        {isModerator ? (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1">
            <Crown className="mr-2 h-3 w-3" /> Modo Moderador Ativo
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground italic">
            Visualização de Administrador
          </Badge>
        )}
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Equipe Atos Multimídia</CardTitle>
          <CardDescription>Gerenciamento centralizado de voluntários e liderança.</CardDescription>
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
                        <Badge variant={u.role === 'moderator' ? "default" : u.role === 'admin' ? "secondary" : "outline"} className="capitalize">
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
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="text-green-600 h-8 w-8 hover:bg-green-50" 
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleApprove(u.id)
                                }}
                                title="Aprovar Usuário"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="text-primary h-8 w-8" 
                              onClick={(e) => {
                                e.preventDefault()
                                handleToggleRole(u.id, u.role)
                              }}
                              title="Ciclar Função"
                            >
                              {u.role === 'moderator' ? <Crown className="h-4 w-4" /> : u.role === 'admin' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            </Button>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive h-8 w-8 hover:bg-red-50" 
                              onClick={() => {
                                setIdToDelete(u.id)
                                setIsDeleteDialogOpen(true)
                              }}
                              title="Remover Usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isModerator && u.id !== currentUser?.uid && (
                          <span className="text-xs text-muted-foreground italic">Somente Leitura</span>
                        )}
                        {u.id === currentUser?.uid && (
                          <span className="text-xs text-primary italic font-bold">Perfil Atual</span>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Banir Usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este usuário permanentemente do sistema? Ele perderá todo o acesso às escalas e conteúdos internos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
