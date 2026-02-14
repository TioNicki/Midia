
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Music, Plus, Search, MoreVertical, PlayCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { useDoc } from "@/firebase"

export default function LouvoresPage() {
  const { firestore } = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")

  // Get user profile to check role
  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdmin = profile?.role === 'admin'

  const songsRef = useMemoFirebase(() => collection(firestore, 'praise_songs'), [firestore])
  const { data: songs, isLoading } = useCollection(songsRef)

  const filteredSongs = songs?.filter(song => 
    song.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    song.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
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
