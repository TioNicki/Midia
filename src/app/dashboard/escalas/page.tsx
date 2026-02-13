
"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Plus, Edit2, Trash2, Filter } from "lucide-react"

const MOCK_ESCALAS = [
  { id: 1, data: "15/04/2024", culto: "Domingo Manhã", equipe: ["Pedro", "Ana", "Lucas"], status: "Confirmado" },
  { id: 2, data: "15/04/2024", culto: "Domingo Noite", equipe: ["Marcos", "Julia", "Fernanda"], status: "Pendente" },
  { id: 3, data: "17/04/2024", culto: "Quarta-feira", equipe: ["Pedro", "Ricardo"], status: "Confirmado" },
  { id: 4, data: "22/04/2024", culto: "Domingo Manhã", equipe: ["TBD"], status: "Aberto" },
]

export default function EscalasPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Culto / Evento</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ESCALAS.map((escala) => (
                <TableRow key={escala.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {escala.data}
                    </div>
                  </TableCell>
                  <TableCell>{escala.culto}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {escala.equipe.map((m, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">{m}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      escala.status === 'Confirmado' ? 'default' : 
                      escala.status === 'Pendente' ? 'outline' : 'destructive'
                    }>
                      {escala.status}
                    </Badge>
                  </TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
