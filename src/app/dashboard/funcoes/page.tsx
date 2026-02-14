
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Loader2, Briefcase } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function FuncoesPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "" })

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isModerator = profile?.role === 'moderator'

  const rolesRef = useMemoFirebase(() => collection(firestore, 'duty_roles'), [firestore])
  const { data: roles, isLoading } = useCollection(rolesRef)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRole.name) return

    const colRef = collection(firestore, 'duty_roles')
    addDocumentNonBlocking(colRef, newRole)
    
    setNewRole({ name: "", description: "" })
    setIsCreateOpen(false)
    toast({ title: "Função criada", description: "A nova função foi adicionada com sucesso." })
  }

  const handleDelete = (id: string) => {
    if (!isModerator) return
    
    if (window.confirm("Deseja realmente excluir esta função? Isso pode afetar escalas futuras.")) {
      const docRef = doc(firestore, 'duty_roles', id)
      deleteDocumentNonBlocking(docRef)
      toast({ title: "Função removida", variant: "destructive" })
    }
  }

  if (!isModerator && profile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold">Acesso Restrito</h3>
        <p className="text-muted-foreground">Apenas moderadores podem gerenciar as funções da equipe.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Funções de Mídia</h2>
          <p className="text-muted-foreground">Gerencie as funções disponíveis para as escalas (ex: Corte, Câmera, Projeção).</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold">
              <Plus className="mr-2 h-4 w-4" /> Nova Função
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Função</DialogTitle>
              <DialogDescription>Defina uma nova atribuição para a equipe de mídia.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Função</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Operador de Corte (vMix)" 
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descrição / Responsabilidades</Label>
                <Textarea 
                  id="desc" 
                  placeholder="Descreva as tarefas desta função..." 
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Salvar Função</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Atribuições</CardTitle>
          <CardDescription>Funções que podem ser designadas aos membros.</CardDescription>
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
                  <TableHead>Função</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{role.description || "Sem descrição"}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDelete(role.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && roles?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Nenhuma função cadastrada.
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
