
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Plus, Edit2, Trash2, Filter, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function EscalasPage() {
  const firestore = useFirestore()
  const { user } = useUser()

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'app_users', user.uid) : null, 
    [firestore, user]
  )
  const { data: profile } = useDoc(userProfileRef)
  const isAdmin = profile?.role === 'admin'

  const rostersRef = useMemoFirebase(() => collection(firestore, 'duty_rosters'), [firestore])
  const { data: rosters, isLoading } = useCollection(rostersRef)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Escalas de Mídia</h2>
          <p className="text-muted-foreground">Organização das equipes por culto e evento.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filtrar
          </Button>
          {isAdmin && (
            <Button className="font-bold">
              <Plus className="mr-2 h-4 w-4" /> Criar Escala
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Datas</CardTitle>
          <CardDescription>Visualize quem estará escalado nos próximos dias.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Culto / Evento</TableHead>
                  <TableHead>Descrição</TableHead>
                  {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosters?.map((escala) => (
                  <TableRow key={escala.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {escala.date ? format(new Date(escala.date), 'dd/MM/yyyy') : '---'}
                      </div>
                    </TableCell>
                    <TableCell>Culto</TableCell>
                    <TableCell>{escala.description}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!isLoading && rosters?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-8 text-muted-foreground">
                      Nenhuma escala encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
