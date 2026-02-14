
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, Plus, Trash2, Loader2, UserPlus, X, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface Assignment {
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
}

export default function EscalasPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)
  const [newRoster, setNewRoster] = useState({ date: "", description: "" })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [currentAssignment, setCurrentAssignment] = useState({ userId: "", roleId: "" })

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const rolesRef = useMemoFirebase(() => collection(firestore, 'duty_roles'), [firestore])
  const { data: roles } = useCollection(rolesRef)

  const usersRef = useMemoFirebase(() => 
    isAdminOrHigher ? collection(firestore, 'app_users') : null, 
    [firestore, isAdminOrHigher]
  )
  const { data: allUsers } = useCollection(usersRef)
  const approvedUsers = allUsers?.filter(u => u.status === 'approved') || []

  const rostersRef = useMemoFirebase(() => collection(firestore, 'duty_rosters'), [firestore])
  const { data: rosters, isLoading } = useCollection(rostersRef)

  const handleAddAssignment = () => {
    if (!currentAssignment.userId || !currentAssignment.roleId) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Selecione um membro e uma função." })
      return
    }

    const selectedUser = approvedUsers.find(u => u.id === currentAssignment.userId)
    const selectedRole = roles?.find(r => r.id === currentAssignment.roleId)

    if (selectedUser && selectedRole) {
      setAssignments([...assignments, {
        userId: selectedUser.id,
        userName: selectedUser.name,
        roleId: selectedRole.id,
        roleName: selectedRole.name
      }])
      setCurrentAssignment({ userId: "", roleId: "" })
    }
  }

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index))
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !newRoster.description) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha a data e o título." })
      return
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const colRef = collection(firestore, 'duty_rosters')
    addDocumentNonBlocking(colRef, { 
      date: dateStr,
      description: newRoster.description,
      assignments,
      createdAt: new Date().toISOString()
    })
    
    setNewRoster({ date: "", description: "" })
    setSelectedDate(undefined)
    setAssignments([])
    setIsCreateOpen(false)
    toast({ title: "Escala criada", description: "A nova escala foi adicionada com sucesso." })
  }

  const confirmDelete = () => {
    if (!idToDelete) return
    const docRef = doc(firestore, 'duty_rosters', idToDelete)
    deleteDocumentNonBlocking(docRef)
    toast({ title: "Escala removida", variant: "destructive" })
    setIdToDelete(null)
    setIsDeleteDialogOpen(false)
  }

  const sortedRosters = rosters ? [...rosters].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Escalas de Mídia</h2>
          <p className="text-muted-foreground">Organização das equipes por culto e evento.</p>
        </div>
        {isAdminOrHigher && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold">
                <Plus className="mr-2 h-4 w-4" /> Criar Escala
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Escala</DialogTitle>
                <DialogDescription>Preencha os dados e escale a equipe.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="date">Data do Culto</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 bg-white",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Título/Culto</Label>
                    <Input 
                      id="desc" 
                      placeholder="Ex: Culto de Celebração" 
                      value={newRoster.description}
                      onChange={(e) => setNewRoster({...newRoster, description: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Escalar Membros
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Membro</Label>
                      <Select 
                        value={currentAssignment.userId} 
                        onValueChange={(v) => setCurrentAssignment({...currentAssignment, userId: v})}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione o membro" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedUsers.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Função</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={currentAssignment.roleId} 
                          onValueChange={(v) => setCurrentAssignment({...currentAssignment, roleId: v})}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" size="icon" onClick={handleAddAssignment}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    {assignments.map((as, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border text-sm animate-in fade-in slide-in-from-right-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{as.userName}</span>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="secondary">{as.roleName}</Badge>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeAssignment(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {assignments.length === 0 && (
                      <p className="text-xs text-center text-muted-foreground italic">Nenhum membro escalado ainda.</p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full font-bold">Publicar Escala</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Datas</CardTitle>
          <CardDescription>Visualize quem estará escalado nos próximos cultos.</CardDescription>
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
                  <TableHead className="hidden md:table-cell">Equipe Escalada</TableHead>
                  {isAdminOrHigher && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRosters.map((escala) => (
                  <TableRow key={escala.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {escala.date ? format(new Date(escala.date + 'T00:00:00'), 'dd/MM/yyyy') : '---'}
                      </div>
                    </TableCell>
                    <TableCell>{escala.description}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {escala.assignments?.map((as: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {as.userName}: {as.roleName}
                          </Badge>
                        ))}
                        {(!escala.assignments || escala.assignments.length === 0) && (
                          <span className="text-xs italic text-muted-foreground">Sem membros</span>
                        )}
                      </div>
                    </TableCell>
                    {isAdminOrHigher && (
                      <TableCell className="text-right">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setIdToDelete(escala.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!isLoading && sortedRosters.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdminOrHigher ? 4 : 3} className="text-center py-8 text-muted-foreground">
                      Nenhuma escala encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a escala selecionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
