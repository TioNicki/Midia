
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarDays, Music, Bell, MessageSquare, Plus, Loader2, ArrowRight, User as UserIcon, CheckCircle2, ArrowLeftRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { formatShortName } from "@/lib/utils"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"

export default function DashboardOverview() {
  const firestore = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [todayDate, setTodayDate] = useState<Date | null>(null)

  useEffect(() => {
    setIsMounted(true)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
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

  const handleConfirmPresence = (rosterId: string) => {
    const roster = rosters?.find(r => r.id === rosterId)
    if (!roster || !user) return

    const newAssignments = roster.assignments.map((as: any) => 
      as.userId === user.uid ? { ...as, status: 'confirmed' } : as
    )

    updateDocumentNonBlocking(doc(firestore, 'duty_rosters', rosterId), {
      assignments: newAssignments
    })

    toast({ title: "Presença confirmada!", description: "Bom serviço!" })
  }

  if (!isMounted || !profile || !todayDate) return <div className="flex h-full items-center justify-center p-20"><Loader2 className="animate-spin" /></div>

  // Localiza a próxima escala do usuário logado
  const myNextRoster = rosters?.filter(r => 
    r.assignments?.some((as: any) => as.userId === user?.uid)
  ).sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
  .find(r => new Date(r.date + 'T00:00:00') >= todayDate)

  const myRole = myNextRoster?.assignments?.find((as: any) => as.userId === user?.uid)

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
            <CardTitle className="text-xs font-medium">Sua Próxima Escala</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myNextRoster ? format(new Date(myNextRoster.date + 'T12:00:00'), 'dd/MM') : '---'}
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
        <Card className="lg:col-span-2 shadow-sm border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Minha Próxima Escala
            </CardTitle>
            <CardDescription>Sua atribuição mais próxima da data atual.</CardDescription>
          </CardHeader>
          <CardContent>
            {isRostersLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : myNextRoster ? (
              <div className="space-y-6">
                <div className="p-5 bg-primary/5 rounded-lg border border-primary/10 flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-primary text-xl">{myNextRoster.description}</h4>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" /> {format(new Date(myNextRoster.date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <div className="mt-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sua Função</p>
                      <p className="text-lg font-bold text-foreground">{myRole?.roleName}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={myRole?.status === 'confirmed' ? 'default' : myRole?.status === 'swap_requested' ? 'destructive' : 'outline'} 
                    className="px-3 py-1"
                  >
                    {myRole?.status === 'confirmed' ? 'Confirmado' : myRole?.status === 'swap_requested' ? 'Troca Pedida' : 'Pendente'}
                  </Badge>
                </div>
                
                <div className="flex gap-3">
                  {myRole?.status === 'pending' && (
                    <Button className="flex-1 font-bold h-12" onClick={() => handleConfirmPresence(myNextRoster.id)}>
                      <CheckCircle2 className="mr-2 h-5 w-5" /> Confirmar Presença
                    </Button>
                  )}
                  {myRole?.status !== 'swap_requested' && (
                    <Button variant="outline" className="flex-1 h-12" onClick={() => router.push('/dashboard/escalas')}>
                      <ArrowLeftRight className="mr-2 h-5 w-5" /> Ver na Escala
                    </Button>
                  )}
                  {myRole?.status === 'confirmed' && (
                    <Button variant="secondary" className="flex-1 h-12" onClick={() => router.push('/dashboard/escalas')}>
                      Ver Equipe Completa
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <p className="text-muted-foreground italic">Você não possui escalas individuais agendadas.</p>
                <Button variant="outline" className="mt-6" onClick={() => router.push('/dashboard/escalas')}>
                  Ver Planejamento do Grupo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
                    <span className="block text-[10px] uppercase">{format(new Date(event.date), 'MMM', { locale: ptBR })}</span>
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
