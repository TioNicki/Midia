
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical, PlayCircle, Loader2, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LouvoresPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSong, setNewSong] = useState({ title: "", artist: "", lyrics: "", notes: "" })

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdminOrHigher = profile?.role === 'admin' || profile?.role === 'moderator'

  const songsRef = useMemoFirebase(() => collection(firestore, 'praise_songs'), [firestore])
  const { data: songs, isLoading } = useCollection(songsRef)

  const filteredSongs = songs?.filter(song => 
    song.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    song.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSong.title || !newSong.artist) return

    const colRef = collection(firestore, 'praise_songs')
    addDocumentNonBlocking(colRef, newSong)
    
    setNewSong({ title: "", artist: "", lyrics: "", notes: "" })
    setIsCreateOpen(false)
    toast({ title: "Louvor adicionado", description: "A música foi cadastrada no banco de dados." })
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja remover este louvor permanentemente?")) {
      const docRef = doc(firestore, 'praise_songs', id)
      deleteDocumentNonBlocking(docRef)
      toast({ title: "Louvor removido" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Banco de Louvores</h2>
          <p className="text-muted-foreground">Cadastre e organize as músicas para a projeção e streaming.</p>
        </div>
        {isAdminOrHigher && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold">
                <Plus className="mr-2 h-4 w-4" /> Novo Louvor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Louvor</DialogTitle>
                <DialogDescription>Insira os detalhes e a letra da música.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Música</Label>
                    <Input 
                      id="title" 
                      placeholder="Ex: Oceans" 
                      value={newSong.title}
                      onChange={(e) => setNewSong({...newSong, title: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artista / Ministério</Label>
                    <Input 
                      id="artist" 
                      placeholder="Ex: Hillsong United" 
                      value={newSong.artist}
                      onChange={(e) => setNewSong({...newSong, artist: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas / Tom (Opcional)</Label>
                  <Input 
                    id="notes" 
                    placeholder="Ex: Sol Maior (G)" 
                    value={newSong.notes}
                    onChange={(e) => setNewSong({...newSong, notes: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lyrics">Letra Completa</Label>
                  <Textarea 
                    id="lyrics" 
                    placeholder="Cole a letra da música aqui..." 
                    className="min-h-[200px]"
                    value={newSong.lyrics}
                    onChange={(e) => setNewSong({...newSong, lyrics: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Cadastrar Música</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Pesquisar por título ou artista..." 
          className="pl-10 h-12 bg-white" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSongs.map((song) => (
            <Card key={song.id} className="group hover:border-primary transition-colors cursor-pointer overflow-hidden">
              <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-primary">{song.title}</CardTitle>
                  <CardDescription>{song.artist}</CardDescription>
                </div>
                {isAdminOrHigher && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(song.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {song.notes && (
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Nota: {song.notes}</span>
                  )}
                </div>
                <PlayCircle className="h-8 w-8 text-muted-foreground group-hover:text-secondary transition-colors" />
              </CardContent>
            </Card>
          ))}
          {!isLoading && filteredSongs.length === 0 && (
            <div className="col-span-full text-center p-12 text-muted-foreground">
              Nenhum louvor encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
