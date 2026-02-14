"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Church, ArrowRight, Video, Music, Calendar } from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  const { user } = useUser()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg text-white">
              <Church className="h-6 w-6" />
            </div>
            <span className="text-xl font-headline font-bold text-primary">Atos Multimídia</span>
          </div>
          <Button 
            onClick={() => router.push(user ? "/dashboard" : "/login")}
            className="font-bold"
          >
            {user ? "Acessar Painel" : "Entrar"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1612043071344-94c20c4c837e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Media Background"
            fill
            className="object-cover opacity-10"
            priority
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary mb-6">
            Mídia com Excelência. <br /> Serviço com Propósito.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestão inteligente de escalas, louvores e eventos para o grupo de mídia da sua igreja. 
            Organização completa para quem serve nos bastidores do Reino.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-lg font-bold shadow-lg" onClick={() => router.push("/login")}>
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg font-bold" onClick={() => router.push("/dashboard/escalas")}>
              Ver Escalas
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md">
              <CardContent className="pt-8 text-center space-y-4">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Escalas Inteligentes</h3>
                <p className="text-muted-foreground">Saiba exatamente quem está em cada função nos cultos e eventos especiais.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-8 text-center space-y-4">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-secondary">
                  <Music className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Banco de Louvores</h3>
                <p className="text-muted-foreground">Letras e notas sempre à mão para a projeção e equipe de streaming.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-8 text-center space-y-4">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-amber-600">
                  <Video className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Cobertura de Eventos</h3>
                <p className="text-muted-foreground">Calendário centralizado para grandes conferências e programações especiais.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-12 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <Church className="h-5 w-5" />
            <span className="font-bold">Atos Multimídia</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} - Sistema Interno de Gestão de Mídia. <br />
            Desenvolvido para servir a igreja com excelência tecnológica.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-card rounded-xl border p-6 ${className}`}>
      {children}
    </div>
  )
}

function CardContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
