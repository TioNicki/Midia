
"use client"

import { useAuth } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Music, Plus, Search, MoreVertical, PlayCircle } from "lucide-react"

const MOCK_LOUVORES = [
  { id: 1, titulo: "Lugar Secreto", artista: "Gabriela Rocha", tom: "C", tags: ["Adoração"] },
  { id: 2, titulo: "Tua Presença", artista: "Central 3", tom: "G", tags: ["Jubilo"] },
  { id: 3, titulo: "Vitorioso És", artista: "Gabriel Guedes", tom: "D", tags: ["Guerra"] },
  { id: 4, titulo: "Ousado Amor", artista: "Isaias Saad", tom: "A", tags: ["Adoração"] },
  { id: 5, titulo: "Que Se Abram Os Céus", artista: "Nivea Soares", tom: "E", tags: ["Oração"] },
]

export default function LouvoresPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Banco de Louvores</h2>
          <p className="text-muted-foreground">Cadastre e organize as músicas para a projeção e streaming.</p>
        </div>
        {isAdmin && (
          <Button className="font-bold">
            <Plus className="mr-2 h-4 w-4" /> Novo Louvor
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar por título, artista ou tag..." className="pl-10 h-12 bg-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_LOUVORES.map((song) => (
          <Card key={song.id} className="group hover:border-primary transition-colors cursor-pointer overflow-hidden">
            <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg text-primary">{song.titulo}</CardTitle>
                <CardDescription>{song.artista}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Tom: {song.tom}</span>
                {song.tags.map(tag => (
                  <span key={tag} className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
              <PlayCircle className="h-8 w-8 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
