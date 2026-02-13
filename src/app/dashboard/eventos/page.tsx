
"use client"

import { useAuth } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Calendar, MapPin, Plus } from "lucide-react"

const MOCK_EVENTOS = [
  { id: 1, titulo: "Conferência de Jovens", data: "20/05/2024", local: "Templo Principal", tipo: "Conferência" },
  { id: 2, titulo: "Batismo Nas Águas", data: "25/05/2024", local: "Área Externa", tipo: "Batismo" },
  { id: 3, titulo: "Escola de Líderes", data: "01/06/2024", local: "Auditório", tipo: "Ensino" },
  { id: 4, titulo: "Noite de Adoração", data: "15/06/2024", local: "Templo Principal", tipo: "Especial" },
]

export default function EventosPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Datas Importantes</h2>
          <p className="text-muted-foreground">Calendário de eventos que exigem cobertura especial de mídia.</p>
        </div>
        {isAdmin && (
          <Button className="font-bold">
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_EVENTOS.map((evento) => (
          <Card key={evento.id} className="flex flex-col md:flex-row overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-primary/5 w-full md:w-40 flex flex-col items-center justify-center p-6 text-primary border-r border-primary/10">
              <Calendar className="h-10 w-10 mb-2" />
              <span className="text-xl font-bold">{evento.data.split('/')[0]}</span>
              <span className="text-sm font-medium uppercase">{evento.data.split('/')[1]} / {evento.data.split('/')[2]}</span>
            </div>
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">{evento.tipo}</span>
                <Bell className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-4">{evento.titulo}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {evento.local}
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Ver Detalhes</Button>
                {isAdmin && <Button variant="secondary" size="sm" className="flex-1">Editar</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
