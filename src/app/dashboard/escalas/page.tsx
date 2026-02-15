
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, Plus, Trash2, Loader2, UserPlus, X, Pencil, Eye, Users, Music } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const [isMounted, setIsMounted] = useState(false)
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [viewingRoster, setViewingRoster] = useState<any | null>(null)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [newRoster, setNewRoster] = useState({ description: "", date: "" })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [currentAssignment, setCurrentAssignment] = useState({ userId: "", roleId: "" })
  const [currentSongId, setCurrentSongId] = useState("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const rolesRef = useMemoFirebase(() => collection(firestore, 'duty_roles'), [firestore])
  const { data: roles } = useCollection(rolesRef)

  const songsRef = useMemoFirebase(() => collection(firestore, 'praise_songs'), [firestore])
  const { data: songs } = useCollection(songsRef)

  const usersRef = useMemoFirebase(() => 
    isAdminOrHigher ? collection(firestore, 'app_users') : null, 
    [firestore, isAdminOrHigher]
  )
  const { data: allUsers } = useCollection(usersRef)
  const approvedUsers = allUsers?.filter(u => u.status === 'approved') || []

  const rostersRef = useMemoFirebase(() => collection(firestore, 'duty_rosters'), [firestore])
  const { data: rosters, isLoading } = useCollection(rostersRef)

  if (!isMounted) return null

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

  const handleAddSong = () => {
    if (!currentSongId) return
    if (selectedSongIds.includes(currentSongId)) {
      toast({ variant: "destructive", title: "Já adicionada", description: "Esta música já está na escala." })
      return
    }
    setSelectedSongIds([...selectedSongIds, currentSongId])
    setCurrentSongId("")
  }

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index))
  }

  const removeSong = (songId: string) => {
    setSelectedSongIds(selectedSongIds.filter(id => id !== songId))
  }

  const handleOpenEdit = (roster: any) => {
    setEditingId(roster.id)
    setNewRoster({ description: roster.description, date: roster.date })
    setAssignments(roster.assignments || [])
    setSelectedSongIds(roster.songIds || [])
    setIsCreateOpen(true)
  }

  const handleCloseDialog = () => {
    setIsCreateOpen(false)
    setEditingId(null)
    setNewRoster({ description: "", date: "" })
    setAssignments([])
    setSelectedSongIds([])
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoster.date || !newRoster.description) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha a data e o título." })
      return
    }

    const rosterData = {
      date: newRoster.date,
      description: newRoster.description,
      assignments,
      songIds: selectedSongIds,
      updatedAt: new Date().toISOString()
    }

    if (editingId) {
      const docRef = doc(firestore, 'duty_rosters', editingId)
      updateDocumentNonBlocking(docRef, rosterData)
      toast({ title: "Escala atualizada", description: "As alterações foram salvas." })
    } else {
      const colRef = collection(firestore, 'duty_rosters')
      addDocumentNonBlocking(colRef, { 
        ...rosterData,
        createdAt: new Date().toISOString()
      })
      toast({ title: "Escala criada", description: "A nova escala foi adicionada com sucesso." })
    }
    
    handleCloseDialog()
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
          <Button className="font-bold" onClick={() => {
            setEditingId(null)
            setNewRoster({ description: "", date: "" })
            setAssignments([])
            setSelectedSongIds([])
            setIsCreateOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" /> Criar Escala
          </Button>
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
                  <TableHead className="hidden md:table-cell">Equipe</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Músicas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRosters.map((escala) => (
                  <TableRow key={escala.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {escala.date ? format(new Date(escala.date + 'T12:00:00'), 'dd/MM/yyyy') : '---'}
                      </div>
                    </TableCell>
                    <TableCell>{escala.description}</TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                         {escala.assignments?.length || 0} Membros
                       </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                       <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">
                         {escala.songIds?.length || 0} Louvores
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-secondary"
                          onClick={() => setViewingRoster(escala)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {isAdminOrHigher && (
                          <>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => handleOpenEdit(escala)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && sortedRosters.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma escala encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Criar/Editar Escala */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-card">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Escala' : 'Nova Escala'}</DialogTitle>
            <DialogDescription>Preencha os dados, escale a equipe e selecione as músicas.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <form onSubmit={handleSave} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roster-date">Data do Culto</Label>
                  <Input 
                    id="roster-date" 
                    type="date" 
                    value={newRoster.date}
                    onChange={(e) => setNewRoster({...newRoster, date: e.target.value})}
                    className="bg-background"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Título/Culto</Label>
                  <Input 
                    id="desc" 
                    placeholder="Ex: Culto de Celebração" 
                    value={newRoster.description}
                    onChange={(e) => setNewRoster({...newRoster, description: e.target.value})}
                    className="bg-background"
                    required
                  />
                </div>
              </div>

              {/* Seção de Membros */}
              <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Escalar Equipe
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Membro</Label>
                    <Select 
                      value={currentAssignment.userId} 
                      onValueChange={(v) => setCurrentAssignment({...currentAssignment, userId: v})}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione o membro" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
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
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {roles?.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="icon" onClick={handleAddAssignment} className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {assignments.map((as, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-background p-2 rounded border text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{as.userName}</span>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">{as.roleName}</Badge>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => removeAssignment(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção de Louvores */}
              <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Music className="h-4 w-4" /> Repertório (Louvores)
                </h4>
                <div className="flex gap-2">
                  <Select 
                    value={currentSongId} 
                    onValueChange={setCurrentSongId}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Adicionar música ao repertório" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {songs?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.title} - {s.artist}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" onClick={handleAddSong} className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  {selectedSongIds.map((sid) => {
                    const s = songs?.find(song => song.id === sid)
                    return (
                      <div key={sid} className="flex items-center justify-between bg-background p-2 rounded border text-sm">
                        <div className="flex items-center gap-2">
                          <Music className="h-3 w-3 text-primary" />
                          <span className="font-bold">{s?.title || 'Música removida'}</span>
                          <span className="text-xs text-muted-foreground">{s?.artist}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => removeSong(sid)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                  {selectedSongIds.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground italic">Nenhuma música selecionada.</p>
                  )}
                </div>
              </div>
              <div className="h-4"></div>
            </form>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" onClick={handleSave} className="font-bold">
              {editingId ? 'Salvar Alterações' : 'Publicar Escala'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Visualização Detalhada */}
      <Dialog open={!!viewingRoster} onOpenChange={(open) => !open && setViewingRoster(null)}>
        <DialogContent className="bg-card max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CalendarDays className="h-6 w-6 text-primary" />
              {viewingRoster?.description}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {viewingRoster?.date ? format(new Date(viewingRoster.date + 'T12:00:00'), 'dd/MM/yyyy') : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 py-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Equipe Escalada
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingRoster?.assignments?.map((as: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <span className="font-bold text-sm">{as.userName}</span>
                      <Badge variant="secondary" className="text-[10px] bg-secondary/10 text-secondary border-secondary/20">
                        {as.roleName}
                      </Badge>
                    </div>
                  ))}
                  {(!viewingRoster?.assignments || viewingRoster.assignments.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">Nenhum membro escalado.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Music className="h-4 w-4" /> Repertório do Culto
                </h4>
                <div className="space-y-2">
                  {viewingRoster?.songIds?.map((sid: string) => {
                    const s = songs?.find(song => song.id === sid)
                    return (
                      <div key={sid} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <PlayCircle className="h-5 w-5 text-primary" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{s?.title}</span>
                            <span className="text-xs text-muted-foreground">{s?.artist}</span>
                          </div>
                        </div>
                        {s?.notes && <Badge variant="outline" className="text-[10px]">{s.notes}</Badge>}
                      </div>
                    )
                  })}
                  {(!viewingRoster?.songIds || viewingRoster.songIds.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">Nenhuma música associada a esta escala.</p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <Button onClick={() => setViewingRoster(null)} className="w-full">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
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

function PlayCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  )
}
