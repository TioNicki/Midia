
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Calendar, MapPin, Plus, Loader2, Trash2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function EventosPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", location: "" })

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const eventsRef = useMemoFirebase(() => collection(firestore, 'important_dates'), [firestore])
  const { data: events, isLoading } = useCollection(eventsRef)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.date) return

    const colRef = collection(firestore, 'important_dates')
    // Converte para ISO com timezone
    const dateFormatted = new Date(newEvent.date).toISOString()
    addDocumentNonBlocking(colRef, { ...newEvent, date: dateFormatted })
    
    setNewEvent({ title: "", description: "", date: "", location: "" })
    setIsCreateOpen(false)
    toast({ title: "Evento criado", description: "O evento foi adicionado ao calendário." })
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja excluir este evento?")) {
      const docRef = doc(firestore, 'important_dates', id)
      deleteDocumentNonBlocking(docRef)
      toast({ title: "Evento removido" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Datas Importantes</h2>
          <p className="text-muted-foreground">Calendário de eventos que exigem cobertura especial de mídia.</p>
        </div>
        {isAdminOrHigher && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold">
                <Plus className="mr-2 h-4 w-4" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
                <DialogDescription>Cadastre um evento especial para a equipe de mídia.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Evento</Label>
                  <Input 
                    id="title" 
                    placeholder="Ex: Conferência de Jovens" 
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-date">Data e Hora</Label>
                  <Input 
                    id="event-date" 
                    type="datetime-local" 
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input 
                    id="location" 
                    placeholder="Ex: Templo Principal" 
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição</Label>
                  <Textarea 
                    id="desc" 
                    placeholder="Detalhes sobre a cobertura de mídia..." 
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Agendar Evento</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events?.map((evento) => {
            const date = evento.date ? new Date(evento.date) : new Date()
            return (
              <Card key={evento.id} className="flex flex-col md:flex-row overflow-hidden hover:shadow-lg transition-shadow relative">
                <div className="bg-primary/5 w-full md:w-40 flex flex-col items-center justify-center p-6 text-primary border-r border-primary/10">
                  <Calendar className="h-10 w-10 mb-2" />
                  <span className="text-xl font-bold">{format(date, 'dd')}</span>
                  <span className="text-sm font-medium uppercase">{format(date, 'MMM / yyyy', { locale: ptBR })}</span>
                </div>
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">Evento</span>
                    <div className="flex gap-2">
                      <Bell className="h-4 w-4 text-amber-500" />
                      {isAdminOrHigher && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDelete(evento.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{evento.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {evento.location || 'Local não informado'}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {evento.description}
                  </p>
                </div>
              </Card>
            )
          })}
          {!isLoading && events?.length === 0 && (
            <div className="col-span-full text-center p-12 text-muted-foreground">
              Nenhum evento agendado.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
