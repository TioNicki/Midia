"use client"

import { useState, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc, writeBatch } from "firebase/firestore"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Calendar, 
  User, 
  ArrowRight,
  ShieldAlert
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { formatShortName } from "@/lib/utils"

export default function TrocasPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const requestsRef = useMemoFirebase(() => 
    isAdminOrHigher ? collection(firestore, 'swap_requests') : null, 
    [firestore, isAdminOrHigher]
  )
  const { data: requests, isLoading } = useCollection(requestsRef)

  const rostersRef = useMemoFirebase(() => collection(firestore, 'duty_rosters'), [firestore])
  const { data: rosters } = useCollection(rostersRef)

  if (!isMounted) return null

  if (!isAdminOrHigher && profile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold">Acesso Negado</h3>
        <p className="text-muted-foreground">Apenas administradores podem gerenciar trocas de escala.</p>
      </div>
    )
  }

  const handleApprove = async (request: any) => {
    setProcessingId(request.id)
    try {
      const batch = writeBatch(firestore)
      
      const originalRoster = rosters?.find(r => r.id === request.originalRosterId)
      const targetRoster = rosters?.find(r => r.id === request.targetRosterId)

      if (!originalRoster || !targetRoster) throw new Error("Escala não encontrada")

      // 1. Remove from original roster
      const newOriginalAssignments = originalRoster.assignments.filter((as: any) => as.userId !== request.userId)
      const originalRef = doc(firestore, 'duty_rosters', request.originalRosterId)
      batch.update(originalRef, { assignments: newOriginalAssignments })

      // 2. Add to target roster
      const newTargetAssignments = [...(targetRoster.assignments || []), {
        userId: request.userId,
        userName: request.userName,
        roleId: request.roleId,
        roleName: request.roleName,
        status: 'confirmed'
      }]
      const targetRef = doc(firestore, 'duty_rosters', request.targetRosterId)
      batch.update(targetRef, { assignments: newTargetAssignments })

      // 3. Mark request as approved
      const requestRef = doc(firestore, 'swap_requests', request.id)
      batch.update(requestRef, { status: 'approved' })

      await batch.commit()
      toast({ title: "Troca Aprovada!", description: "As escalas foram atualizadas automaticamente." })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao processar", description: "Não foi possível completar a troca." })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = (requestId: string, rosterId: string, userId: string) => {
    setProcessingId(requestId)
    
    // Update request status
    const requestRef = doc(firestore, 'swap_requests', requestId)
    updateDocumentNonBlocking(requestRef, { status: 'rejected' })

    // Reset roster assignment status to 'pending'
    const roster = rosters?.find(r => r.id === rosterId)
    if (roster) {
      const newAssignments = roster.assignments.map((as: any) => 
        as.userId === userId ? { ...as, status: 'pending' } : as
      )
      const rosterRef = doc(firestore, 'duty_rosters', rosterId)
      updateDocumentNonBlocking(rosterRef, { assignments: newAssignments })
    }

    toast({ title: "Troca Recusada", variant: "destructive" })
    setProcessingId(null)
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Trocas de Escala</h2>
        <p className="text-muted-foreground">Gerencie as solicitações de mudança de data da equipe.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pendingRequests.map((req) => (
          <Card key={req.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-lg">{formatShortName(req.userName)}</p>
                    <Badge variant="secondary" className="text-[10px] uppercase">{req.roleName}</Badge>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-center gap-4 bg-muted/30 p-4 rounded-lg border border-dashed">
                  <div className="text-center min-w-[120px]">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Original</p>
                    <p className="text-sm font-bold truncate">{format(new Date(req.originalRosterDate + 'T12:00:00'), 'dd/MM')}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center min-w-[120px]">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Destino</p>
                    <p className="text-sm font-bold text-primary truncate">{req.targetRosterDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="text-green-600 border-green-200 hover:bg-green-50 font-bold"
                    onClick={() => handleApprove(req)}
                    disabled={!!processingId}
                  >
                    {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Aprovar
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-destructive border-destructive/20 hover:bg-destructive/5 font-bold"
                    onClick={() => handleReject(req.id, req.originalRosterId, req.userId)}
                    disabled={!!processingId}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Recusar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && pendingRequests.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/10">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhuma solicitação de troca pendente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
