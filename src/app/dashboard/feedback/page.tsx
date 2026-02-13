
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Send, Heart, Lightbulb, AlertTriangle } from "lucide-react"

export default function FeedbackPage() {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState("elogio")
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Feedback enviado!",
        description: "Agradecemos sua contribuição para o crescimento do grupo.",
      })
    }, 1000)
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
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Heart className="mb-2 h-6 w-6 text-red-500" />
                    Elogio
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="ideia" id="ideia" className="peer sr-only" />
                  <Label
                    htmlFor="ideia"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Lightbulb className="mb-2 h-6 w-6 text-amber-500" />
                    Ideia
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="reclamacao" id="reclamacao" className="peer sr-only" />
                  <Label
                    htmlFor="reclamacao"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
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
