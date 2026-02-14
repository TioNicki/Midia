
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarDays, Music, Bell, MessageSquare, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export default function DashboardOverview() {
  const firestore = useFirestore()
  const { user } = useUser()

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const rostersRef = useMemoFirebase(() => collection(firestore, 'duty_rosters'), [firestore])
  const { data: rosters } = useCollection(rostersRef)

  const songsRef = useMemoFirebase(() => collection(firestore, 'praise_songs'), [firestore])
  const { data: songs } = useCollection(songsRef)

  const eventsRef = useMemoFirebase(() => collection(firestore, 'important_dates'), [firestore])
  const { data: events } = useCollection(eventsRef)

  const feedbacksRef = useMemoFirebase(() => collection(firestore, 'feedback'), [firestore])
  const { data: feedbacks } = useCollection(feedbacksRef)

  const stats = [
    { 
      title: "Próxima Escala", 
      value: rosters && rosters[0] ? format(new Date(rosters[0].date), 'dd/MM, HH:mm') : "---", 
      icon: CalendarDays, 
      color: "text-primary" 
    },
    { 
      title: "Banco de Louvores", 
      value: `${songs?.length || 0} Músicas`, 
      icon: Music, 
      color: "text-secondary" 
    },
    { 
      title: "Eventos Próximos", 
      value: `${events?.length || 0} Datas`, 
      icon: Bell, 
      color: "text-amber-500" 
    },
    { 
      title: "Feedbacks", 
      value: `${feedbacks?.length || 0} Mensagens`, 
      icon: MessageSquare, 
      color: "text-teal-500" 
    },
  ]

  if (isProfileLoading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Olá, {profile?.name || user?.email?.split('@')[0]}!</h2>
          <p className="text-muted-foreground">Aqui está um resumo do que está acontecendo no grupo de mídia.</p>
        </div>
        {isAdminOrHigher && (
          <Button className="h-11 shadow-lg font-bold">
            <Plus className="mr-2 h-4 w-4" /> Nova Escala
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Equipe em Serviço - Próximo Culto</CardTitle>
            <CardDescription>Escala automática baseada no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rosters && rosters[0] ? (
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
                  <p className="text-sm font-medium">{rosters[0].description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Veja os detalhes na aba Escalas.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground py-8 italic">
                  Nenhuma equipe escalada para o próximo culto.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Louvores Recentes</CardTitle>
            <CardDescription>Últimas músicas adicionadas ao banco</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {songs?.slice(0, 4).map((song) => (
                <div key={song.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.artist}</p>
                  </div>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">ID: {song.id.slice(0, 4)}</span>
                </div>
              ))}
              {(!songs || songs.length === 0) && (
                <p className="text-sm text-center text-muted-foreground py-8 italic">
                  Nenhum louvor cadastrado.
                </p>
              )}
            </div>
            {isAdminOrHigher && (
              <Button variant="outline" className="w-full mt-4">Ver Todos os Louvores</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
