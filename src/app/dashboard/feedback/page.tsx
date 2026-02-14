
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  MessageSquare, 
  Send, 
  Heart, 
  Lightbulb, 
  AlertTriangle, 
  User, 
  Calendar,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { format } from "date-fns"

export default function FeedbackPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState("elogio")
  const [message, setMessage] = useState("")

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdmin = profile?.role === 'admin'

  // Só busca feedbacks se o usuário for admin
  const feedbacksRef = useMemoFirebase(() => 
    isAdmin ? collection(firestore, 'feedback') : null, 
    [firestore, isAdmin]
  )
  const { data: feedbacks, isLoading: isLoadingFeedbacks } = useCollection(feedbacksRef)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const feedbackData = {
      type,
      message,
      submittedByUserId: user.uid,
      submissionDateTime: new Date().toISOString(),
    }

    const colRef = collection(firestore, 'feedback')
    addDocumentNonBlocking(colRef, feedbackData)
      .then(() => {
        setLoading(false)
        setMessage("")
        toast({
          title: "Feedback enviado!",
          description: "Agradecemos sua contribuição para o crescimento do grupo.",
        })
      })
      .catch(() => {
        setLoading(false)
      })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "elogio": return <Heart className="h-4 w-4 text-red-500" />
      case "ideia": return <Lightbulb className="h-4 w-4 text-amber-500" />
      case "reclamacao": return <AlertTriangle className="h-4 w-4 text-destructive" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "elogio": return "Elogio"
      case "ideia": return "Ideia"
      case "reclamacao": return "Reclamação"
      default: return type
    }
  }

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Gestão de Feedbacks</h2>
          <p className="text-muted-foreground">Analise as sugestões e comentários enviados pela equipe de mídia.</p>
        </div>

        {isLoadingFeedbacks ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {feedbacks?.map((fb) => (
              <Card key={fb.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {getTypeIcon(fb.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getTypeLabel(fb.type)}
                        <Badge variant="outline" className="font-normal">
                          #{fb.id.slice(-4)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3" /> Membro • <Calendar className="h-3 w-3" /> {fb.submissionDateTime ? format(new Date(fb.submissionDateTime), 'dd/MM/yyyy HH:mm') : '---'}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary font-bold">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como Lido
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground bg-muted/30 p-4 rounded-lg border italic">
                    "{fb.message}"
                  </p>
                </CardContent>
              </Card>
            ))}
            {!isLoadingFeedbacks && (!feedbacks || feedbacks.length === 0) && (
              <div className="text-center p-12 text-muted-foreground bg-white rounded-lg border">
                Nenhum feedback recebido até o momento.
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-headline font-bold text-primary">Central de Feedback</h2>
        <p className="text-muted-foreground">Envie sua ideia, reclamação ou elogio para melhorarmos juntos.</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Nova Mensagem
          </CardTitle>
          <CardDescription>Suas sugestões são analisadas pela liderança de mídia.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Tipo de Mensagem</Label>
              <RadioGroup defaultValue="elogio" onValueChange={setType} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <RadioGroupItem value="elogio" id="elogio" className="peer sr-only" />
                  <Label
                    htmlFor="elogio"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Heart className="mb-2 h-6 w-6 text-red-500" />
                    Elogio
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="ideia" id="ideia" className="peer sr-only" />
                  <Label
                    htmlFor="ideia"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Lightbulb className="mb-2 h-6 w-6 text-amber-500" />
                    Ideia
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="reclamacao" id="reclamacao" className="peer sr-only" />
                  <Label
                    htmlFor="reclamacao"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <AlertTriangle className="mb-2 h-6 w-6 text-destructive" />
                    Reclamação
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Sua Mensagem</Label>
              <Textarea 
                id="message" 
                placeholder="Descreva detalhadamente sua sugestão ou comentário..." 
                className="min-h-[150px] bg-white"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
              {loading ? "Enviando..." : (
                <>
                  <Send className="mr-2 h-5 w-5" /> Enviar Feedback
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="bg-primary/5 rounded-lg p-6 text-center border border-primary/10">
        <p className="text-sm italic text-muted-foreground">
          "Pois somos cooperadores de Deus; vocês são lavoura de Deus e edifício de Deus." <br />
          <strong>1 Coríntios 3:9</strong>
        </p>
      </div>
    </div>
  )
}
