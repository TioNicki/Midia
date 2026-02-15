
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical, PlayCircle, Loader2, Trash2, Eye, Pencil, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function LouvoresPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)
  const [viewingSong, setViewingSong] = useState<any | null>(null)
  
  const [songData, setSongData] = useState({ title: "", artist: "", lyrics: "", notes: "" })

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

  const handleOpenCreate = () => {
    setEditingId(null)
    setSongData({ title: "", artist: "", lyrics: "", notes: "" })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (song: any) => {
    setEditingId(song.id)
    setSongData({ title: song.title, artist: song.artist, lyrics: song.lyrics, notes: song.notes || "" })
    setIsFormOpen(true)
  }

  const handleViewSong = (song: any) => {
    setViewingSong(song)
    setIsViewOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!songData.title || !songData.artist) {
      toast({ variant: "destructive", title: "Erro", description: "Título e Artista são obrigatórios." })
      return
    }

    if (editingId) {
      const docRef = doc(firestore, 'praise_songs', editingId)
      updateDocumentNonBlocking(docRef, { ...songData, updatedAt: new Date().toISOString() })
      toast({ title: "Louvor atualizado", description: "As alterações foram salvas com sucesso." })
    } else {
      const colRef = collection(firestore, 'praise_songs')
      addDocumentNonBlocking(colRef, { ...songData, createdAt: new Date().toISOString() })
      toast({ title: "Louvor adicionado", description: "A música foi cadastrada no banco de dados." })
    }
    
    setIsFormOpen(false)
    setEditingId(null)
    setSongData({ title: "", artist: "", lyrics: "", notes: "" })
  }

  const confirmDelete = () => {
    if (!idToDelete) return
    const docRef = doc(firestore, 'praise_songs', idToDelete)
    deleteDocumentNonBlocking(docRef)
    toast({ title: "Louvor removido", variant: "destructive" })
    setIdToDelete(null)
    setIsDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Banco de Louvores</h2>
          <p className="text-muted-foreground">Cadastre e organize as músicas para a projeção e streaming.</p>
        </div>
        {isAdminOrHigher && (
          <Button className="font-bold" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Louvor
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Pesquisar por título ou artista..." 
          className="pl-10 h-12 bg-card" 
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
            <Card key={song.id} className="group hover:border-primary transition-colors overflow-hidden relative bg-card cursor-pointer" onClick={() => handleViewSong(song)}>
              <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-primary">{song.title}</CardTitle>
                  <CardDescription>{song.artist}</CardDescription>
                </div>
                {isAdminOrHigher && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(song); }}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIdToDelete(song.id)
                          setIsDeleteDialogOpen(true)
                        }}
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
                <div className="flex gap-2">
                   <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
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

      {/* Diálogo de Formulário (Criar/Editar) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Louvor" : "Cadastrar Novo Louvor"}</DialogTitle>
            <DialogDescription>Insira os detalhes e a letra da música.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Música</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Oceans" 
                  value={songData.title}
                  onChange={(e) => setSongData({...songData, title: e.target.value})}
                  className="bg-background"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist">Artista / Ministério</Label>
                <Input 
                  id="artist" 
                  placeholder="Ex: Hillsong United" 
                  value={songData.artist}
                  onChange={(e) => setSongData({...songData, artist: e.target.value})}
                  className="bg-background"
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas / Tom (Opcional)</Label>
              <Input 
                id="notes" 
                placeholder="Ex: Sol Maior (G)" 
                value={songData.notes}
                onChange={(e) => setSongData({...songData, notes: e.target.value})}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lyrics">Letra Completa</Label>
              <Textarea 
                id="lyrics" 
                placeholder="Cole a letra da música aqui..." 
                className="min-h-[250px] bg-background"
                value={songData.lyrics}
                onChange={(e) => setSongData({...songData, lyrics: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full font-bold">
                {editingId ? "Salvar Alterações" : "Cadastrar Música"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Visualização da Letra */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-card">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl text-primary">{viewingSong?.title}</DialogTitle>
                <DialogDescription className="text-lg">{viewingSong?.artist}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden py-4">
            <div className="mb-4 flex gap-4">
               {viewingSong?.notes && (
                 <div className="bg-muted px-3 py-1 rounded-md border text-sm font-bold">
                   Tom: {viewingSong.notes}
                 </div>
               )}
            </div>
            <ScrollArea className="h-full rounded-md border p-6 bg-background/50">
              <pre className="whitespace-pre-wrap font-body text-base leading-relaxed text-foreground">
                {viewingSong?.lyrics || "Letra não cadastrada."}
              </pre>
            </ScrollArea>
          </div>

          <DialogFooter className="gap-2">
            {isAdminOrHigher && (
              <Button variant="outline" onClick={() => { setIsViewOpen(false); handleOpenEdit(viewingSong); }}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Button>
            )}
            <Button onClick={() => setIsViewOpen(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Louvor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta música será removida permanentemente do banco de dados. Letras e notas associadas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Louvor</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
