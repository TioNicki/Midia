
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc, query, where, serverTimestamp } from "firebase/firestore"
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, Plus, Trash2, Loader2, UserPlus, X, Pencil, Eye, Users, Music, Check, ArrowLeftRight, Clock, AlertTriangle, MessageSquare } from "lucide-react"
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

  // Filter rosters where current user is assigned
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

    // Update assignment status in roster to show requested
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
          <p className="text-muted-foreground">Gerenciamento de voluntários por culto ou evento.</p>
        </div>
        {isAdminOrHigher && (
          <Button onClick={() => setIsCreateOpen(true)} className="font-bold">
            <Plus className="mr-2 h-4 w-4" /> Criar Escala
          </Button>
        )}
      </div>

      {/* Seção do Usuário: Minhas Próximas Atribuições */}
      {myAssignments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 p-1 rounded-full"><Users className="h-4 w-4" /></Badge>
            Suas Próximas Atribuições
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssignments.map((roster) => {
              const myRole = roster.assignments.find((as: any) => as.userId === user?.uid)
              return (
                <Card key={roster.id} className="border-l-4 border-l-primary overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">{myRole?.roleName}</p>
                        <h4 className="text-lg font-bold">{roster.description}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(new Date(roster.date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={myRole?.status === 'confirmed' ? 'default' : myRole?.status === 'swap_requested' ? 'destructive' : 'outline'}>
                        {myRole?.status === 'confirmed' ? 'Confirmado' : myRole?.status === 'swap_requested' ? 'Troca Solicitada' : 'Pendente'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {myRole?.status === 'pending' && (
                        <Button size="sm" className="flex-1 font-bold" onClick={() => handleConfirmPresence(roster.id)}>
                          <Check className="mr-2 h-4 w-4" /> Confirmar
                        </Button>
                      )}
                      {myRole?.status !== 'swap_requested' && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenSwap(roster.id)}>
                          <ArrowLeftRight className="mr-2 h-4 w-4" /> Solicitar Troca
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

      {/* Tabela Geral de Escalas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Todas as Escalas
          </CardTitle>
          <CardDescription>Visualização completa do planejamento do grupo.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Culto / Evento</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosters?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(roster => (
                  <TableRow key={roster.id}>
                    <TableCell className="font-medium">
                      {format(new Date(roster.date + 'T12:00:00'), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{roster.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roster.assignments?.map((as: any, i: number) => (
                          <Badge key={i} variant="outline" className={`text-[9px] px-1.5 h-5 flex gap-1 items-center ${as.status === 'confirmed' ? 'border-green-500 text-green-600 bg-green-50' : as.status === 'swap_requested' ? 'border-red-500 text-red-600 bg-red-50' : ''}`}>
                            {as.status === 'confirmed' && <Check className="h-2 w-2" />}
                            {as.status === 'swap_requested' && <ArrowLeftRight className="h-2 w-2" />}
                            {formatShortName(as.userName)} ({as.roleName})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isAdminOrHigher && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(roster)} title="Editar Escala">
                              <Pencil className="h-4 w-4 text-primary" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setIdToDelete(roster.id); setIsDeleteDialogOpen(true); }}
                              title="Excluir Escala"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && rosters?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                      Nenhuma escala cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Troca de Escala */}
      <Dialog open={isSwapOpen} onOpenChange={setIsSwapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" /> Solicitar Troca de Escala
            </DialogTitle>
            <DialogDescription>Escolha outra escala para a qual deseja ser movido.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestSwap} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mudar para qual Escala / Data?</Label>
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
              <Label>Motivo (Opcional)</Label>
              <Textarea 
                placeholder="Ex: Terei um compromisso familiar inadiável..."
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
              {editingId ? 'Editar' : 'Nova'} Escala de Mídia
            </DialogTitle>
            <DialogDescription>Preencha os dados e selecione a equipe para o evento.</DialogDescription>
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
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição / Nome do Culto</Label>
                  <Input 
                    placeholder="Ex: Culto da Família"
                    value={newRoster.description} 
                    onChange={e => setNewRoster({...newRoster, description: e.target.value})} 
                    required 
                    className="bg-background"
                  />
                </div>
              </div>

              <Card className="border-dashed border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" /> Montar Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
                    <div className="sm:col-span-3 space-y-2">
                      <Label className="text-xs">Voluntário</Label>
                      <Select value={currentMemberId} onValueChange={setCurrentMemberId}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione o membro..." />
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
                      <Select value={currentRoleId} onValueChange={setCurrentRoleId}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione a função..." />
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
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Membros Escalados</Label>
                    {assignments.length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed rounded-lg text-muted-foreground text-xs">
                        Ninguém escalado ainda.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {assignments.map((as, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-background group">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{formatShortName(as.userName)}</span>
                              <span className="text-[10px] text-primary uppercase font-medium">{as.roleName}</span>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeAssignment(idx)}
                            >
                              <X className="h-4 w-4" />
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
                  <Music className="h-5 w-5 text-primary" /> Repertório (Louvores)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {songs?.map(song => (
                    <div 
                      key={song.id} 
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedSongIds.includes(song.id) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-muted'
                      }`}
                      onClick={() => toggleSong(song.id)}
                    >
                      <Checkbox 
                        checked={selectedSongIds.includes(song.id)}
                        onCheckedChange={() => toggleSong(song.id)}
                        className="pointer-events-none"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate">{song.title}</p>
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
              {editingId ? 'Atualizar' : 'Salvar'} Escala
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Escala?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente esta escala. Os membros deixarão de receber notificações sobre este evento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
