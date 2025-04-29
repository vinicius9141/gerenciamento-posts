"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Calendar, PlusCircle, Search, MoreVertical, Copy, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NotificationsPopover } from "@/components/notifications"
import { useToast } from "@/hooks/use-toast"
import { getAllClients, createClient, deleteClient, generateClientCode, createCalendar } from "@/lib/firebase"

export default function AdminDashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [newClient, setNewClient] = useState({ name: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [newCalendar, setNewCalendar] = useState({ name: "", color: "#E1306C" })
  const { toast } = useToast()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const clientsData = await getAllClients()
      setClients(clientsData)
    } catch (error: any) {
      console.error("Error loading clients:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes: " + (error.message || ""),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.code?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddClient = async () => {
    if (!newClient.name.trim()) return

    try {
      setIsLoading(true)
      // Gerar código único para o cliente
      const newCode = generateClientCode()

      await createClient({
        name: newClient.name,
        code: newCode,
      })

      toast({
        title: "Cliente adicionado",
        description: `Cliente ${newClient.name} criado com sucesso. Código: ${newCode}`,
      })

      setNewClient({ name: "" })
      setIsAddClientOpen(false)
      await loadClients()
    } catch (error: any) {
      console.error("Error adding client:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cliente: " + (error.message || ""),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClient = async (id: string) => {
    try {
      setIsLoading(true)
      await deleteClient(id)
      toast({
        title: "Cliente excluído",
        description: "Cliente excluído com sucesso",
      })
      await loadClients()
    } catch (error: any) {
      console.error("Error deleting client:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente: " + (error.message || ""),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCalendar = async () => {
    if (!selectedClient || !newCalendar.name.trim()) return

    try {
      setIsLoading(true)
      await createCalendar({
        clientId: selectedClient,
        name: newCalendar.name,
        color: newCalendar.color,
      })

      toast({
        title: "Calendário adicionado",
        description: `Calendário ${newCalendar.name} adicionado com sucesso`,
      })

      setNewCalendar({ name: "", color: "#E1306C" })
      setIsAddCalendarOpen(false)
      await loadClients()
    } catch (error: any) {
      console.error("Error adding calendar:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o calendário: " + (error.message || ""),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openAddCalendarDialog = (clientId: string) => {
    setSelectedClient(clientId)
    setIsAddCalendarOpen(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "Código copiado para a área de transferência",
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/admin/dashboard" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">PostScheduler Admin</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/admin/dashboard" className="transition-colors hover:text-foreground/80">
                Dashboard
              </Link>
              <Link href="/admin/posts" className="transition-colors hover:text-foreground/80">
                Posts
              </Link>
              <Link href="/admin/settings" className="transition-colors hover:text-foreground/80">
                Configurações
              </Link>
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <NotificationsPopover />
            <Link href="/">
              <Button variant="outline" size="sm">
                Sair
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie clientes e posts agendados</p>
          </div>
        </div>

        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="clients">
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="posts">
              <Calendar className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="clients">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Clientes</CardTitle>
                  <CardDescription>Adicione, edite ou remova clientes do sistema</CardDescription>
                </div>
                <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                      <DialogDescription>
                        Preencha as informações do cliente para gerar um código de acesso
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Cliente</Label>
                        <Input
                          id="name"
                          value={newClient.name}
                          onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                          placeholder="Nome da empresa ou cliente"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddClientOpen(false)} disabled={isLoading}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddClient} disabled={isLoading}>
                        {isLoading ? "Adicionando..." : "Adicionar Cliente"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar clientes..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                {isLoading && <div className="text-center py-4">Carregando clientes...</div>}
                {!isLoading && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead>Calendários</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.code}</TableCell>
                          <TableCell>{client.name}</TableCell>
                          <TableCell>{client.postsCount || 0}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {client.calendars && client.calendars.length > 0 ? (
                                client.calendars.map((calendar: any) => (
                                  <div
                                    key={calendar.id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                                    style={{ backgroundColor: `${calendar.color}20`, color: calendar.color }}
                                  >
                                    {calendar.name}
                                  </div>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-xs">Nenhum calendário</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Abrir menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openAddCalendarDialog(client.id)}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Adicionar calendário
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyToClipboard(client.code)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copiar código
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar cliente
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/client/calendar/${client.code}`}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Ver calendário
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteClient(client.id)}>
                                  <Trash className="h-4 w-4 mr-2" />
                                  Excluir cliente
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredClients.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            Nenhum cliente encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Posts</CardTitle>
                <CardDescription>Visualize e gerencie todos os posts agendados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar posts..." className="pl-8" />
                  </div>
                  <Link href="/admin/posts/new">
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Novo Post
                    </Button>
                  </Link>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Link href="/admin/posts" className="text-primary hover:underline">
                    Clique aqui para gerenciar todos os posts
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Dialog open={isAddCalendarOpen} onOpenChange={setIsAddCalendarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Calendário</DialogTitle>
            <DialogDescription>Adicione um novo calendário para o cliente</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="calendarName">Nome do Calendário</Label>
              <Input
                id="calendarName"
                value={newCalendar.name}
                onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                placeholder="Ex: Instagram, Facebook, TikTok"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calendarColor">Cor do Calendário</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="calendarColor"
                  type="color"
                  value={newCalendar.color}
                  onChange={(e) => setNewCalendar({ ...newCalendar, color: e.target.value })}
                  className="w-12 h-8 p-1"
                  disabled={isLoading}
                />
                <div className="flex-1 h-8 rounded-md" style={{ backgroundColor: newCalendar.color }} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCalendarOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAddCalendar} disabled={isLoading}>
              {isLoading ? "Adicionando..." : "Adicionar Calendário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
