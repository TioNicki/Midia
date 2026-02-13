
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-store"
import { CalendarDays, Music, Bell, MessageSquare, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardOverview() {
  const { user } = useAuth()

  const stats = [
    { title: "Próxima Escala", value: "Domingo, 10:00", icon: CalendarDays, color: "text-primary" },
    { title: "Louvores Hoje", value: "5 Músicas", icon: Music, color: "text-secondary" },
    { title: "Eventos Próximos", value: "3 Datas", icon: Bell, color: "text-amber-500" },
    { title: "Feedback Pendente", value: "2 Novos", icon: MessageSquare, color: "text-teal-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Olá, {user?.name}!</h2>
          <p className="text-muted-foreground">Aqui está um resumo do que está acontecendo no grupo de mídia.</p>
        </div>
        {user?.role === 'admin' && (
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
            <CardDescription>Domingo, 19:00 - Culto de Celebração</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Carlos Silva", role: "Projeção", avatar: "CS" },
                { name: "Mariana Oliveira", role: "Streaming", avatar: "MO" },
                { name: "João Pedro", role: "Som Front", avatar: "JP" },
                { name: "Ana Luiza", role: "Fotografia", avatar: "AL" },
              ].map((member) => (
                <div key={member.name} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500" title="Confirmado" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Louvores do Próximo Culto</CardTitle>
            <CardDescription>Seleção feita pelo Ministério de Louvor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Tua Presença", artist: "Central 3", duration: "5:20" },
                { title: "Lugar Secreto", artist: "Gabriela Rocha", duration: "6:45" },
                { title: "Ousado Amor", artist: "Isaias Saad", duration: "4:30" },
                { title: "Aclame ao Senhor", artist: "Diante do Trono", duration: "5:10" },
              ].map((song) => (
                <div key={song.title} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.artist}</p>
                  </div>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{song.duration}</span>
                </div>
              ))}
            </div>
            {user?.role === 'admin' && (
              <Button variant="outline" className="w-full mt-4">Ver Todos os Louvores</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
