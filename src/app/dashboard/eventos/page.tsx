
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Calendar, MapPin, Plus, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function EventosPage() {
  const firestore = useFirestore()
  const { user } = useUser()

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const eventsRef = useMemoFirebase(() => collection(firestore, 'important_dates'), [firestore])
  const { data: events, isLoading } = useCollection(eventsRef)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Datas Importantes</h2>
          <p className="text-muted-foreground">Calendário de eventos que exigem cobertura especial de mídia.</p>
        </div>
        {isAdminOrHigher && (
          <Button className="font-bold">
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Button>
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
              <Card key={evento.id} className="flex flex-col md:flex-row overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-primary/5 w-full md:w-40 flex flex-col items-center justify-center p-6 text-primary border-r border-primary/10">
                  <Calendar className="h-10 w-10 mb-2" />
                  <span className="text-xl font-bold">{format(date, 'dd')}</span>
                  <span className="text-sm font-medium uppercase">{format(date, 'MMM / yyyy', { locale: ptBR })}</span>
                </div>
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">Evento</span>
                    <Bell className="h-4 w-4 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{evento.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {evento.location || 'Local não informado'}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {evento.description}
                  </p>
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">Ver Detalhes</Button>
                    {isAdminOrHigher && <Button variant="secondary" size="sm" className="flex-1">Editar</Button>}
                  </div>
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
