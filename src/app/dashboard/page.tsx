
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarDays, Music, Bell, MessageSquare, Plus, Loader2, ArrowRight, User as UserIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function DashboardOverview() {
  const firestore = useFirestore()
  const { user } = useUser()
  const router = useRouter()

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const rostersRef = useMemoFirebase(() => collection(firestore, 'duty_rosters'), [firestore])
  const { data: rosters, isLoading: isRostersLoading } = useCollection(rostersRef)

  const songsRef = useMemoFirebase(() => collection(firestore, 'praise_songs'), [firestore])
  const { data: songs } = useCollection(songsRef)

  const eventsRef = useMemoFirebase(() => collection(firestore, 'important_dates'), [firestore])
  const { data: events } = useCollection(eventsRef)

  const feedbacksRef = useMemoFirebase(() => 
    isAdminOrHigher ? collection(firestore, 'feedback') : null, 
    [firestore, isAdminOrHigher]
  )
  const { data: feedbacks } = useCollection(feedbacksRef)

  // Pegar a escala mais próxima (ordenada por data)
  const sortedRosters = rosters ? [...rosters].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : []
  const nextRoster = sortedRosters.find(r => new Date(r.date + 'T23:59:59') >= new Date()) || sortedRosters[0]

  const isUserEscalated = nextRoster?.assignments?.some((as: any) => as.userId === user?.uid)

  const stats = [
    { 
      title: "Próxima Escala", 
      value: nextRoster ? format(new Date(nextRoster.date + 'T12:00:00'), 'dd/MM') : "---", 
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
      value: isAdminOrHigher ? `${feedbacks?.length || 0} Mensagens` : "Central Ativa", 
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
          <p className="text-muted-foreground">Bem-vindo ao painel do Atos Multimídia.</p>
        </div>
        {isAdminOrHigher && (
          <Button 
            className="h-11 shadow-lg font-bold"
            onClick={() => router.push("/dashboard/escalas")}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Escala
          </Button>
        )}
      </div>

      {isUserEscalated && (
        <Card className="bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary p-2 rounded-full text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-primary">Você está escalado!</p>
              <p className="text-sm text-muted-foreground">Você faz parte da equipe do próximo culto: <span className="font-semibold">{nextRoster.description}</span>.</p>
            </div>
          </CardContent>
        </Card>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximo Culto em Serviço</CardTitle>
              <CardDescription>Confira quem estará servindo na mídia</CardDescription>
            </div>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isRostersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : nextRoster ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg border border-primary/10">
                  <div>
                    <h4 className="font-bold text-lg text-primary">{nextRoster.description}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(nextRoster.date + 'T12:00:00'), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 md:mt-0"
                    onClick={() => router.push("/dashboard/escalas")}
                  >
                    Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nextRoster.assignments?.map((as: any, idx: number) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-md border ${as.userId === user?.uid ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20' : 'bg-card border-border'}`}>
                      <div className={`p-2 rounded-full ${as.userId === user?.uid ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-foreground">{as.userName}</p>
                        <Badge variant="secondary" className="text-[10px] py-0 bg-secondary/10 text-secondary border-secondary/20">{as.roleName}</Badge>
                      </div>
                    </div>
                  ))}
                  {(!nextRoster.assignments || nextRoster.assignments.length === 0) && (
                    <p className="text-sm text-center text-muted-foreground py-4 italic col-span-full">
                      Nenhum membro escalado para este culto.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma equipe escalada para os próximos dias.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Louvores Recentes</CardTitle>
            <CardDescription>Músicas novas no banco</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {songs?.slice(0, 5).map((song) => (
                <div key={song.id} className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-muted/10 transition-colors p-1 rounded">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">#{song.id.slice(-4)}</Badge>
                </div>
              ))}
              {(!songs || songs.length === 0) && (
                <p className="text-sm text-center text-muted-foreground py-8 italic">
                  Nenhum louvor cadastrado.
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-primary font-bold"
              onClick={() => router.push("/dashboard/louvores")}
            >
              Ver Banco Completo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
