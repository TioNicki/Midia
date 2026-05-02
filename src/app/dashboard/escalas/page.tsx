
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, Plus, Trash2, Loader2, X, Pencil, Users, Music, Check, ArrowLeftRight, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatShortName } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

export default function EscalasPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSwapOpen, setIsSwapOpen] = useState(false)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)
  
  // States for creation/edit
  const [newRoster, setNewRoster] = useState({ description: "", date: "" })
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [currentMemberId, setCurrentMemberId] = useState("")
  const [currentRoleId, setCurrentRoleId] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // States for Swap Request
  const [swapData, setSwapData] = useState({ originalRosterId: "", targetRosterId: "", reason: "" })

  useEffect(() => setIsMounted(true), [])

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'app_users', user.uid) : null, [firestore, user])
  const { data: profile } = useDoc(userProfileRef)
  const groupId = profile?.groupId
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const rolesQuery = useMemoFirebase(() => groupId ? query(collection(firestore, 'duty_roles'), where('groupId', '==', groupId)) : null, [firestore, groupId])
  const { data: roles } = useCollection(rolesQuery)

  const songsQuery = useMemoFirebase(() => groupId ? query(collection(firestore, 'praise_songs'), where('groupId', '==', groupId)) : null, [firestore, groupId])
  const { data: songs } = useCollection(songsQuery)

  const usersQuery = useMemoFirebase(() => groupId ? query(collection(firestore, 'app_users'), where('groupId', '==', groupId)) : null, [firestore, groupId])
  const { data: allUsers } = useCollection(usersQuery)
  const approvedUsers = allUsers?.filter(u => u.status === 'approved') || []

  const rostersQuery = useMemoFirebase(() => groupId ? query(collection(firestore, 'duty_rosters'), where('groupId', '==', groupId)) : null, [firestore, groupId])
  const { data: rosters, isLoading } = useCollection(rostersQuery)

  // Filter rosters where current user is assigned (for all roles)
  const myAssignments = rosters?.filter(r => 
    r.assignments?.some((as: any) => as.userId === user?.uid)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || []

  const handleAddAssignment = () => {
    if (!currentMemberId || !currentRoleId) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um membro e uma função." })
      return
    }

    const member = approvedUsers.find(u => u.id === currentMemberId)
    const role = roles?.find(r => r.id === currentRoleId)

    if (!member || !role) return

    const exists = assignments.some(a => a.userId === member.id && a.roleId === role.id)
    if (exists) {
      toast({ variant: "destructive", title: "Aviso", description: "Este membro já está escalado nesta função." })
      return
    }

    setAssignments([...assignments, {
      userId: member.id,
      userName: member.name,
      roleId: role.id,
      roleName: role.name,
      status: 'pending'
    }])
    
    setCurrentMemberId("")
    setCurrentRoleId("")
  }

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index))
  }

  const toggleSong = (songId: string) => {
    setSelectedSongIds(prev => 
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !newRoster.date || !newRoster.description) return

    const rosterData = {
      groupId,
      date: newRoster.date,
      description: newRoster.description,
      assignments: assignments.map(a => ({ ...a, status: a.status || 'pending' })),
      songIds: selectedSongIds,
      updatedAt: new Date().toISOString()
    }

    if (editingId) {
      updateDocumentNonBlocking(doc(firestore, 'duty_rosters', editingId), rosterData)
      toast({ title: "Escala atualizada!" })
    } else {
      addDocumentNonBlocking(collection(firestore, 'duty_rosters'), { 
        ...rosterData, 
        createdAt: new Date().toISOString() 
      })
      toast({ title: "Escala criada com sucesso!" })
    }
    
    closeDialog()
  }

  const handleConfirmPresence = (rosterId: string) => {
    const roster = rosters?.find(r => r.id === rosterId)
    if (!roster || !user) return

    const newAssignments = roster.assignments.map((as: any) => 
      as.userId === user.uid ? { ...as, status: 'confirmed' } : as
    )

    updateDocumentNonBlocking(doc(firestore, 'duty_rosters', rosterId), {
      assignments: newAssignments
    })

    toast({ title: "Presença confirmada!", description: "Obrigado por servir!" })
  }

  const handleOpenSwap = (rosterId: string) => {
    setSwapData({ ...swapData, originalRosterId: rosterId })
    setIsSwapOpen(true)
  }

  const handleRequestSwap = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !groupId || !swapData.originalRosterId || !swapData.targetRosterId) return

    const originalRoster = rosters?.find(r => r.id === swapData.originalRosterId)
    const targetRoster = rosters?.find(r => r.id === swapData.targetRosterId)
    const userAssignment = originalRoster?.assignments?.find((as: any) => as.userId === user.uid)

    if (!originalRoster || !targetRoster || !userAssignment) return

    const swapRequest = {
      groupId,
      userId: user.uid,
      userName: profile?.name || user.displayName || "Membro",
      roleId: userAssignment.roleId,
      roleName: userAssignment.roleName,
      originalRosterId: swapData.originalRosterId,
      originalRosterDate: originalRoster.date,
      originalRosterDesc: originalRoster.description,
      targetRosterId: swapData.targetRosterId,
      targetRosterDesc: targetRoster.description,
      reason: swapData.reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    addDocumentNonBlocking(collection(firestore, 'swap_requests'), swapRequest)

    const newAssignments = originalRoster.assignments.map((as: any) => 
      as.userId === user.uid ? { ...as, status: 'swap_requested' } : as
    )
    updateDocumentNonBlocking(doc(firestore, 'duty_rosters', swapData.originalRosterId), {
      assignments: newAssignments
    })

    setIsSwapOpen(false)
    setSwapData({ originalRosterId: "", targetRosterId: "", reason: "" })
    toast({ title: "Troca solicitada", description: "A liderança analisará seu pedido." })
  }

  const closeDialog = () => {
    setIsCreateOpen(false)
    setEditingId(null)
    setNewRoster({ description: "", date: "" })
    setAssignments([])
    setSelectedSongIds([])
    setCurrentMemberId("")
    setCurrentRoleId("")
  }

  const openEdit = (roster: any) => {
    setEditingId(roster.id)
    setNewRoster({ description: roster.description, date: roster.date })
    setAssignments(roster.assignments || [])
    setSelectedSongIds(roster.songIds || [])
    setIsCreateOpen(true)
  }

  const confirmDelete = () => {
    if (!idToDelete) return
    deleteDocumentNonBlocking(doc(firestore, 'duty_rosters', idToDelete))
    toast({ variant: "destructive", title: "Escala excluída" })
    setIdToDelete(null)
    setIsDeleteDialogOpen(false)
  }

  if (!isMounted || !profile) return null

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Escalas de Mídia</h2>
          <p className="text-muted-foreground">Gerenciamento e acompanhamento dos voluntários.</p>
        </div>
        {isAdminOrHigher && (
          <Button onClick={() => setIsCreateOpen(true)} className="font-bold">
            <Plus className="mr-2 h-4 w-4" /> Criar Escala
          </Button>
        )}
      </div>

      {/* Seção de Atribuições (Visível para Membros, Admins e Moderadores que estão escalados) */}
      {myAssignments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 p-1 rounded-full"><Users className="h-4 w-4" /></Badge>
            Suas Próximas Atribuições
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAssignments.map((roster) => {
              const myRole = roster.assignments.find((as: any) => as.userId === user?.uid)
              return (
                <Card key={roster.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">{myRole?.roleName}</p>
                        <h4 className="text-base font-bold truncate">{roster.description}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(new Date(roster.date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={myRole?.status === 'confirmed' ? 'default' : myRole?.status === 'swap_requested' ? 'destructive' : 'outline'} className="text-[10px]">
                        {myRole?.status === 'confirmed' ? 'Confirmado' : myRole?.status === 'swap_requested' ? 'Troca Pedida' : 'Pendente'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {myRole?.status === 'pending' && (
                        <Button size="sm" className="flex-1 font-bold h-8 text-xs" onClick={() => handleConfirmPresence(roster.id)}>
                          <Check className="mr-1 h-3 w-3" /> Confirmar
                        </Button>
                      )}
                      {myRole?.status !== 'swap_requested' && (
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleOpenSwap(roster.id)}>
                          <ArrowLeftRight className="mr-1 h-3 w-3" /> Solicitar Troca
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabela de Escalas */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Planejamento Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead className="text-right w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosters?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(roster => (
                  <TableRow key={roster.id} className="hover:bg-muted/10">
                    <TableCell className="font-medium text-xs">
                      {format(new Date(roster.date + 'T12:00:00'), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{roster.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roster.assignments?.map((as: any, i: number) => (
                          <Badge key={i} variant="outline" className={`text-[9px] px-1.5 h-5 flex gap-1 items-center font-normal ${as.status === 'confirmed' ? 'border-green-500 text-green-600 bg-green-50' : as.status === 'swap_requested' ? 'border-red-500 text-red-600 bg-red-50' : ''}`}>
                            {as.status === 'confirmed' && <Check className="h-2 w-2" />}
                            {as.status === 'swap_requested' && <ArrowLeftRight className="h-2 w-2" />}
                            {formatShortName(as.userName)} <span className="opacity-50 text-[8px]">({as.roleName})</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdminOrHigher && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(roster)} title="Editar">
                            <Pencil className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => { setIdToDelete(roster.id); setIsDeleteDialogOpen(true); }}
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && rosters?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic text-sm">
                      Nenhuma escala futura agendada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Troca */}
      <Dialog open={isSwapOpen} onOpenChange={setIsSwapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" /> Solicitar Troca
            </DialogTitle>
            <DialogDescription>Escolha outra escala para a qual deseja ser movido.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestSwap} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mudar para qual Escala?</Label>
              <Select value={swapData.targetRosterId} onValueChange={(val) => setSwapData({...swapData, targetRosterId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destino..." />
                </SelectTrigger>
                <SelectContent>
                  {rosters?.filter(r => r.id !== swapData.originalRosterId && new Date(r.date) >= new Date()).map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {format(new Date(r.date + 'T12:00:00'), 'dd/MM')} - {r.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea 
                placeholder="Ex: Terei um compromisso..."
                value={swapData.reason}
                onChange={(e) => setSwapData({...swapData, reason: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSwapOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!swapData.targetRosterId}>Enviar Solicitação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Criação/Edição (ADMIN) */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-4xl bg-card max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-2xl text-primary flex items-center gap-2">
              <CalendarDays className="h-6 w-6" />
              {editingId ? 'Editar' : 'Nova'} Escala
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <form onSubmit={handleSave} className="space-y-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Data do Evento</Label>
                  <Input 
                    type="date" 
                    value={newRoster.date} 
                    onChange={e => setNewRoster({...newRoster, date: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Culto / Evento</Label>
                  <Input 
                    placeholder="Ex: Culto de Domingo"
                    value={newRoster.description} 
                    onChange={e => setNewRoster({...newRoster, description: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <Card className="border-dashed border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" /> Escalar Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
                    <div className="sm:col-span-3 space-y-2">
                      <Label className="text-xs">Voluntário</Label>
                      <Select value={currentMemberId} onValueChange={currentMemberId => setCurrentMemberId(currentMemberId)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedUsers.map(u => (
                            <SelectItem key={u.id} value={u.id}>{formatShortName(u.name)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-3 space-y-2">
                      <Label className="text-xs">Função</Label>
                      <Select value={currentRoleId} onValueChange={currentRoleId => setCurrentRoleId(currentRoleId)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roles?.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" onClick={handleAddAssignment} className="w-full sm:col-span-1">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4">
                    {assignments.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {assignments.map((as, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-background group">
                            <div className="flex flex-col">
                              <span className="font-bold text-xs">{formatShortName(as.userName)}</span>
                              <span className="text-[9px] text-primary uppercase font-bold">{as.roleName}</span>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeAssignment(idx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" /> Repertório
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {songs?.map(song => (
                    <div 
                      key={song.id} 
                      className={`flex items-center space-x-2 p-3 rounded-md border transition-colors cursor-pointer ${
                        selectedSongIds.includes(song.id) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-muted'
                      }`}
                      onClick={() => toggleSong(song.id)}
                    >
                      <Checkbox 
                        checked={selectedSongIds.includes(song.id)}
                        onCheckedChange={() => toggleSong(song.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{song.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} className="font-bold">
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Escala?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
