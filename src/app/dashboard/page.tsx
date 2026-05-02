
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarDays, Music, Bell, MessageSquare, Plus, Loader2, ArrowRight, User as UserIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { formatShortName } from "@/lib/utils"

export default function DashboardOverview() {
  const firestore = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [todayDate, setTodayDate] = useState<Date | null>(null)

  useEffect(() => {
    setIsMounted(true)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Define o início do dia para comparação justa
    setTodayDate(now)
  }, [])

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const groupId = profile?.groupId
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const rostersQuery = useMemoFirebase(() => 
    groupId ? query(collection(firestore, 'duty_rosters'), where('groupId', '==', groupId)) : null,
    [firestore, groupId]
  )
  const { data: rosters, isLoading: isRostersLoading } = useCollection(rostersQuery)

  const songsQuery = useMemoFirebase(() => 
    groupId ? query(collection(firestore, 'praise_songs'), where('groupId', '==', groupId)) : null,
    [firestore, groupId]
  )
  const { data: songs } = useCollection(songsQuery)

  const eventsQuery = useMemoFirebase(() => 
    groupId ? query(collection(firestore, 'important_dates'), where('groupId', '==', groupId)) : null,
    [firestore, groupId]
  )
  const { data: events } = useCollection(eventsQuery)

  const feedbacksQuery = useMemoFirebase(() => 
    isAdminOrHigher && groupId ? query(collection(firestore, 'feedback'), where('groupId', '==', groupId)) : null, 
    [firestore, isAdminOrHigher, groupId]
  )
  const { data: feedbacks } = useCollection(feedbacksQuery)

  if (!isMounted || !profile || !todayDate) return <div className="flex h-full items-center justify-center p-20"><Loader2 className="animate-spin" /></div>

  // Ordenar e encontrar a próxima escala (hoje ou futura)
  const sortedRosters = rosters ? [...rosters].sort((a,b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()) : []
  const nextRoster = sortedRosters.find(r => {
    const rosterDate = new Date(r.date + 'T00:00:00')
    return rosterDate >= todayDate
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Olá, {formatShortName(profile.name)}!</h2>
          <p className="text-muted-foreground">Painel exclusivo da sua igreja.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Próxima Escala</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextRoster ? format(new Date(nextRoster.date + 'T12:00:00'), 'dd/MM') : '---'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Louvores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{songs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbacks?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Escala em Destaque
            </CardTitle>
            <CardDescription>Escala mais próxima da data atual.</CardDescription>
          </CardHeader>
          <CardContent>
            {isRostersLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : nextRoster ? (
              <div className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <h4 className="font-bold text-primary text-lg">{nextRoster.description}</h4>
                  <p className="text-sm text-muted-foreground">{format(new Date(nextRoster.date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: require('date-fns/locale/pt-BR').ptBR })}</p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <UserIcon className="h-4 w-4" /> Equipe Escalada
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {nextRoster.assignments?.map((as: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">{formatShortName(as.userName)}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{as.roleName}</span>
                        </div>
                        <Badge 
                          variant={as.status === 'confirmed' ? 'default' : as.status === 'swap_requested' ? 'destructive' : 'outline'} 
                          className="text-[9px] h-5"
                        >
                          {as.status === 'confirmed' ? 'Confirmado' : as.status === 'swap_requested' ? 'Troca' : 'Pendente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={() => router.push('/dashboard/escalas')}>
                  Ver Todas as Escalas <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground italic">Nenhuma escala futura agendada.</p>
                {isAdminOrHigher && (
                  <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/escalas')}>
                    <Plus className="mr-2 h-4 w-4" /> Criar Escala
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {events && events.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Eventos Próximos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3).map((event) => (
                <div key={event.id} className="flex gap-3 items-start p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => router.push('/dashboard/eventos')}>
                  <div className="bg-primary/10 text-primary p-2 rounded text-center min-w-[50px]">
                    <span className="block text-xs font-bold">{format(new Date(event.date), 'dd')}</span>
                    <span className="block text-[10px] uppercase">{format(new Date(event.date), 'MMM', { locale: require('date-fns/locale/pt-BR').ptBR })}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{event.location || 'Local não informado'}</p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-primary text-xs" onClick={() => router.push('/dashboard/eventos')}>
                Ver Calendário Completo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
