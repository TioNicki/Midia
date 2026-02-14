
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, Plus, Edit2, Trash2, Filter, Loader2 } from "lucide-react"
import { format } from "date-fns"
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

export default function EscalasPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRoster, setNewRoster] = useState({ date: "", description: "" })

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const rostersRef = useMemoFirebase(() => collection(firestore, 'duty_rosters'), [firestore])
  const { data: rosters, isLoading } = useCollection(rostersRef)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoster.date || !newRoster.description) return

    const colRef = collection(firestore, 'duty_rosters')
    addDocumentNonBlocking(colRef, newRoster)
    
    setNewRoster({ date: "", description: "" })
    setIsCreateOpen(false)
    toast({ title: "Escala criada", description: "A nova escala foi adicionada com sucesso." })
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir esta escala?")) {
      const docRef = doc(firestore, 'duty_rosters', id)
      deleteDocumentNonBlocking(docRef)
      toast({ title: "Escala removida" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Escalas de Mídia</h2>
          <p className="text-muted-foreground">Organização das equipes por culto e evento.</p>
        </div>
        <div className="flex gap-2">
          {isAdminOrHigher && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold">
                  <Plus className="mr-2 h-4 w-4" /> Criar Escala
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Escala</DialogTitle>
                  <DialogDescription>Preencha os dados do próximo culto ou evento.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data do Culto</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={newRoster.date} 
                      onChange={(e) => setNewRoster({...newRoster, date: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Descrição / Observações</Label>
                    <Textarea 
                      id="desc" 
                      placeholder="Ex: Culto de Celebração - Equipe A" 
                      value={newRoster.description}
                      onChange={(e) => setNewRoster({...newRoster, description: e.target.value})}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full">Salvar Escala</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Datas</CardTitle>
          <CardDescription>Visualize quem estará escalado nos próximos dias.</CardDescription>
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
                  <TableHead>Data</TableHead>
                  <TableHead>Culto / Evento</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  {isAdminOrHigher && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosters?.map((escala) => (
                  <TableRow key={escala.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {escala.date ? format(new Date(escala.date + 'T00:00:00'), 'dd/MM/yyyy') : '---'}
                      </div>
                    </TableCell>
                    <TableCell>Culto</TableCell>
                    <TableCell className="hidden md:table-cell">{escala.description}</TableCell>
                    {isAdminOrHigher && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(escala.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!isLoading && rosters?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdminOrHigher ? 4 : 2} className="text-center py-8 text-muted-foreground">
                      Nenhuma escala encontrada.
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
