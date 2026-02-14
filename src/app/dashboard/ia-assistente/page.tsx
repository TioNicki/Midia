"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, Send, Palette, Share2, Heart, MessageSquare, Loader2 } from "lucide-react"
import { mediaAssistant } from "@/ai/flows/media-assistant-flow"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function IAAssistentePage() {
  const [prompt, setPrompt] = useState("")
  const [context, setContext] = useState<"visual" | "social" | "devotional" | "general">("general")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")
  const { toast } = useToast()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const response = await mediaAssistant({ prompt, context })
      setResult(response.suggestion)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na IA",
        description: "Não foi possível gerar a sugestão agora."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-amber-500" />
            Assistente Criativo IA
          </h2>
          <p className="text-muted-foreground">Potencialize a criatividade do Atos Multimídia com Inteligência Artificial.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">O que você precisa?</CardTitle>
            <CardDescription>Escolha o contexto para melhores resultados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="w-full" onValueChange={(v) => setContext(v as any)}>
              <TabsList className="grid grid-cols-2 gap-2 h-auto bg-transparent p-0">
                <TabsTrigger value="visual" className="flex flex-col gap-1 p-3 data-[state=active]:bg-primary/10">
                  <Palette className="h-4 w-4" /> <span>Visual</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="flex flex-col gap-1 p-3 data-[state=active]:bg-primary/10">
                  <Share2 className="h-4 w-4" /> <span>Social</span>
                </TabsTrigger>
                <TabsTrigger value="devotional" className="flex flex-col gap-1 p-3 data-[state=active]:bg-primary/10">
                  <Heart className="h-4 w-4" /> <span>Devocional</span>
                </TabsTrigger>
                <TabsTrigger value="general" className="flex flex-col gap-1 p-3 data-[state=active]:bg-primary/10">
                  <MessageSquare className="h-4 w-4" /> <span>Geral</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Descreva sua necessidade</Label>
                <Textarea
                  id="prompt"
                  placeholder={
                    context === 'visual' ? "Ex: Sugira um tema visual para o culto de Santa Ceia..." :
                    context === 'social' ? "Ex: Legenda para foto da equipe trabalhando no domingo..." :
                    context === 'devotional' ? "Ex: Uma palavra de encorajamento para quem está cansado..." :
                    "O que você gostaria de criar?"
                  }
                  className="min-h-[120px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                {loading ? (
                  <> <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Ideias... </>
                ) : (
                  <> <Send className="mr-2 h-5 w-5" /> Gerar com IA </>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-1 bg-gradient-to-r from-primary to-secondary rounded-lg">
                  <div className="bg-white dark:bg-card p-6 rounded-[calc(var(--radius)-4px)]">
                    <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                      <Sparkles className="h-4 w-4" />
                      Sugestão da IA
                    </div>
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                      {result}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(result)
                          toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." })
                        }}
                      >
                        Copiar Sugestão
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
