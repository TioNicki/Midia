
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
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setIsMounted(true)
    setNow(new Date())
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

  if (!isMounted || !profile || !now) return <div className="flex h-full items-center justify-center p-20"><Loader2 className="animate-spin" /></div>

  const sortedRosters = rosters ? [...rosters].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : []
  const nextRoster = sortedRosters.find(r => new Date(r.date + 'T23:59:59') >= now) || sortedRosters[0]
  const isUserEscalated = nextRoster?.assignments?.some((as: any) => as.userId === user?.uid)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Olá, {formatShortName(profile.name)}!</h2>
          <p className="text-muted-foreground">Painel exclusivo da sua igreja.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium">Próxima Escala</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{nextRoster ? format(new Date(nextRoster.date + 'T12:00:00'), 'dd/MM') : '---'}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium">Louvores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{songs?.length || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium">Eventos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{events?.length || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium">Feedback</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{feedbacks?.length || 0}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Próximo Culto</CardTitle></CardHeader>
          <CardContent>
            {isRostersLoading ? <Loader2 className="animate-spin mx-auto" /> : nextRoster ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <h4 className="font-bold text-primary">{nextRoster.description}</h4>
                  <p className="text-sm">{format(new Date(nextRoster.date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {nextRoster.assignments?.map((as: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded text-sm">
                      <UserIcon className="h-3 w-3" />
                      <span className="truncate">{formatShortName(as.userName)}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">{as.roleName}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-center text-muted-foreground italic">Nenhuma escala futura.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
