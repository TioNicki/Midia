
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, Plus, Trash2, Loader2, UserPlus, X, Pencil, Eye, Users, Music, Check, ArrowLeftRight, Clock, AlertTriangle } from "lucide-react"
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
import { formatShortName } from "@/lib/utils"

interface Assignment {
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  status: 'pending' | 'confirmed' | 'swap_requested';
}

export default function EscalasPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSwapOpen, setIsSwapOpen] = useState(false)
  const [viewingRoster, setViewingRoster] = useState<any | null>(null)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [newRoster, setNewRoster] = useState({ description: "", date: "" })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [currentAssignment, setCurrentAssignment] = useState({ userId: "", roleId: "" })
  const [currentSongId, setCurrentSongId] = useState("")

  // Swap state
  const [swapOriginalRoster, setSwapOriginalRoster] = useState<any>(null)
  const [swapTargetRosterId, setSwapTargetRosterId] = useState("")

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
        roleName: selectedRole.name,
        status: 'pending'
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
      assignments: assignments.map(a => ({ ...a, status: a.status || 'pending' })),
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

  const handleConfirmPresence = (roster: any) => {
    const newAssignments = roster.assignments.map((as: Assignment) => 
      as.userId === user?.uid ? { ...as, status: 'confirmed' } : as
    )
    const docRef = doc(firestore, 'duty_rosters', roster.id)
    updateDocumentNonBlocking(docRef, { assignments: newAssignments })
    toast({ title: "Presença Confirmada", description: "Bom serviço!" })
  }

  const handleOpenSwap = (roster: any) => {
    setSwapOriginalRoster(roster)
    setIsSwapOpen(true)
  }

  const handleRequestSwap = () => {
    if (!swapTargetRosterId) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione o culto de destino." })
      return
    }

    const targetRoster = rosters?.find(r => r.id === swapTargetRosterId)
    const userAssignment = swapOriginalRoster.assignments.find((as: Assignment) => as.userId === user?.uid)

    const swapRequest = {
      userId: user?.uid,
      userName: profile?.name || user?.displayName,
      originalRosterId: swapOriginalRoster.id,
      originalRosterDate: swapOriginalRoster.date,
      targetRosterId: swapTargetRosterId,
      targetRosterDesc: targetRoster?.description,
      roleId: userAssignment.roleId,
      roleName: userAssignment.roleName,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    // Update roster assignment status to 'swap_requested'
    const newAssignments = swapOriginalRoster.assignments.map((as: Assignment) => 
      as.userId === user?.uid ? { ...as, status: 'swap_requested' } : as
    )
    const rosterRef = doc(firestore, 'duty_rosters', swapOriginalRoster.id)
    updateDocumentNonBlocking(rosterRef, { assignments: newAssignments })

    // Create swap request document
    const requestsRef = collection(firestore, 'swap_requests')
    addDocumentNonBlocking(requestsRef, swapRequest)

    toast({ title: "Solicitação Enviada", description: "Aguarde a aprovação da liderança." })
    setIsSwapOpen(false)
    setSwapOriginalRoster(null)
    setSwapTargetRosterId("")
  }

  const sortedRosters = rosters ? [...rosters].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Escalas de Mídia</h2>
          <p className="text-muted-foreground">Organização das equipes por culto e evento.</p>
        </div>
        {isAdminOrHigher && (
          <Button className="font-bold w-full md:w-auto" onClick={() => {
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

      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-6 sm:p-6">
          <CardTitle>Próximas Datas</CardTitle>
          <CardDescription>Confirme sua presença ou solicite troca de data.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Data</TableHead>
                  <TableHead>Culto</TableHead>
                  <TableHead className="hidden md:table-cell">Equipe</TableHead>
                  <TableHead className="text-center">Meu Status</TableHead>
                  <TableHead className="text-right px-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRosters.map((escala) => {
                  const userAssignment = escala.assignments?.find((as: Assignment) => as.userId === user?.uid)
                  return (
                    <TableRow key={escala.id} className={userAssignment ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium px-4">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <CalendarDays className="h-4 w-4 text-muted-foreground hidden sm:inline" />
                          {escala.date ? format(new Date(escala.date + 'T12:00:00'), 'dd/MM') : '--/--'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{escala.description}</TableCell>
                      <TableCell className="hidden md:table-cell">
                         <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                           {escala.assignments?.length || 0} Membros
                         </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {userAssignment ? (
                          <Badge 
                            variant={userAssignment.status === 'confirmed' ? "default" : userAssignment.status === 'swap_requested' ? "destructive" : "outline"}
                            className="text-[10px]"
                          >
                            {userAssignment.status === 'confirmed' ? 'Confirmado' : userAssignment.status === 'swap_requested' ? 'Troca Solicitada' : 'Pendente'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-4">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          {userAssignment && userAssignment.status === 'pending' && (
                            <>
                              <Button 
                                type="button"
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleConfirmPresence(escala)}
                              >
                                <Check className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">Confirmar</span>
                              </Button>
                              <Button 
                                type="button"
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={() => handleOpenSwap(escala)}
                              >
                                <ArrowLeftRight className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">Trocar</span>
                              </Button>
                            </>
                          )}
                          
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-secondary"
                            onClick={() => setViewingRoster(escala)}
                            title="Ver Detalhes"
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
                                title="Editar"
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
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[90vh] overflow-hidden flex flex-col bg-card">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingId ? 'Editar Escala' : 'Nova Escala'}</DialogTitle>
            <DialogDescription>Preencha os dados, escale a equipe e selecione as músicas.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 min-h-0">
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
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold truncate">{formatShortName(as.userName)}</span>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 truncate">{as.roleName}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="text-[10px] h-5 capitalize">{as.status || 'pending'}</Badge>
                         <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => removeAssignment(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Music className="h-4 w-4" /> Repertório (Louvores)
                </h4>
                <div className="flex gap-2">
                  <Select 
                    value={currentSongId} 
                    onValueChange={currentSongId => setCurrentSongId(currentSongId)}
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
                        <div className="flex items-center gap-2 min-w-0">
                          <Music className="h-3 w-3 text-primary shrink-0" />
                          <span className="font-bold truncate">{s?.title || 'Música removida'}</span>
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">{s?.artist}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => removeSong(sid)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" onClick={handleSave} className="font-bold">
              {editingId ? 'Salvar Alterações' : 'Publicar Escala'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingRoster} onOpenChange={(open) => !open && setViewingRoster(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl h-[90vh] flex flex-col bg-card overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl truncate">
              <CalendarDays className="h-6 w-6 text-primary shrink-0" />
              {viewingRoster?.description}
            </DialogTitle>
            <DialogDescription className="text-base sm:text-lg">
              {viewingRoster?.date ? format(new Date(viewingRoster.date + 'T12:00:00'), 'dd/MM/yyyy') : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 py-4 min-h-0">
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Equipe Escalada
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingRoster?.assignments?.map((as: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <div className="flex flex-col min-w-0 mr-2">
                        <span className="font-bold text-sm truncate">{formatShortName(as.userName)}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{as.roleName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         {as.status === 'confirmed' ? (
                           <Badge className="bg-green-500 hover:bg-green-600 h-5 px-1">
                             <Check className="h-3 w-3 mr-0.5" /> <span className="text-[8px]">OK</span>
                           </Badge>
                         ) : as.status === 'swap_requested' ? (
                           <Badge variant="destructive" className="h-5 px-1 animate-pulse">
                             <ArrowLeftRight className="h-3 w-3 mr-0.5" /> <span className="text-[8px]">TROCA</span>
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="h-5 px-1 bg-background text-muted-foreground">
                             <Clock className="h-3 w-3 mr-0.5" /> <span className="text-[8px]">PEND</span>
                           </Badge>
                         )}
                      </div>
                    </div>
                  ))}
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
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm truncate">{s?.title}</span>
                          <span className="text-xs text-muted-foreground truncate">{s?.artist}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t shrink-0">
            <Button onClick={() => setViewingRoster(null)} className="w-full">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSwapOpen} onOpenChange={setIsSwapOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-amber-500" /> Solicitar Troca
            </DialogTitle>
            <DialogDescription>
              Escolha para qual culto você gostaria de ser movido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/30 rounded-lg border text-sm">
              <p><strong>De:</strong> {swapOriginalRoster?.description} ({swapOriginalRoster?.date ? format(new Date(swapOriginalRoster.date + 'T12:00:00'), 'dd/MM') : ''})</p>
              <p><strong>Minha Função:</strong> {swapOriginalRoster?.assignments?.find((a: Assignment) => a.userId === user?.uid)?.roleName}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Mudar para o Culto:</Label>
              <Select value={swapTargetRosterId} onValueChange={setSwapTargetRosterId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o culto de destino" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {sortedRosters
                    .filter(r => r.id !== swapOriginalRoster?.id)
                    .map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {format(new Date(r.date + 'T12:00:00'), 'dd/MM')} - {r.description}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">Sua escala atual ficará como "Troca Solicitada" e a liderança será notificada para aprovar.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSwapOpen(false)}>Cancelar</Button>
            <Button className="font-bold" onClick={handleRequestSwap}>Solicitar Troca</Button>
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
