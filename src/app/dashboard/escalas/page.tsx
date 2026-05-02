
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, Plus, Trash2, Loader2, UserPlus, X, Pencil, Eye, Users, Music, Check, ArrowLeftRight, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatShortName } from "@/lib/utils"

export default function EscalasPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRoster, setNewRoster] = useState({ description: "", date: "" })
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [currentAssignment, setCurrentAssignment] = useState({ userId: "", roleId: "" })
  const [editingId, setEditingId] = useState<string | null>(null)

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
    } else {
      addDocumentNonBlocking(collection(firestore, 'duty_rosters'), { ...rosterData, createdAt: new Date().toISOString() })
    }
    setIsCreateOpen(false)
    setEditingId(null)
  }

  if (!isMounted || !profile) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-headline font-bold text-primary">Escalas de Mídia</h2>
        {isAdminOrHigher && <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2" /> Criar Escala</Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Culto</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {rosters?.map(roster => (
                  <TableRow key={roster.id}>
                    <TableCell>{format(new Date(roster.date + 'T12:00:00'), 'dd/MM')}</TableCell>
                    <TableCell>{roster.description}</TableCell>
                    <TableCell><Badge variant="outline">{roster.assignments?.length || 0} Membros</Badge></TableCell>
                    <TableCell className="text-right">
                      {isAdminOrHigher && <Button variant="ghost" size="icon" onClick={() => { setEditingId(roster.id); setNewRoster(roster); setAssignments(roster.assignments); setSelectedSongIds(roster.songIds); setIsCreateOpen(true); }}><Pencil className="h-4 w-4" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Nova'} Escala</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={newRoster.date} onChange={e => setNewRoster({...newRoster, date: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={newRoster.description} onChange={e => setNewRoster({...newRoster, description: e.target.value})} required /></div>
            </div>
            <Button type="submit" className="w-full">Salvar Escala</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
