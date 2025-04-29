"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, PlusCircle, Search, Loader2 } from "lucide-react"
import { PostCard } from "@/components/post-card"
import { NotificationsPopover } from "@/components/notifications"
import { getAllClients, getPostsByClient } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

export default function PostsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "calendar">("grid")

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientPosts(selectedClient)
    } else {
      setPosts([])
      setFilteredPosts([])
    }
  }, [selectedClient])

  useEffect(() => {
    filterPosts()
  }, [searchTerm, posts])

  const loadClients = async () => {
    try {
      setIsLoadingClients(true)
      const clientsData = await getAllClients()
      setClients(clientsData)

      // Se houver clientes, selecione o primeiro por padrão
      if (clientsData.length > 0) {
        setSelectedClient(clientsData[0].id)
      }
    } catch (error: any) {
      console.error("Error loading clients:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes: " + (error.message || ""),
        variant: "destructive",
      })
    } finally {
      setIsLoadingClients(false)
    }
  }

  const loadClientPosts = async (clientId: string) => {
    try {
      setIsLoadingPosts(true)
      const postsData = await getPostsByClient(clientId)
      console.log("Posts carregados:", postsData)
      setPosts(postsData)
      setFilteredPosts(postsData)
    } catch (error: any) {
      console.error("Error loading posts:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os posts: " + (error.message || ""),
        variant: "destructive",
      })
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const filterPosts = () => {
    if (!searchTerm.trim() || !posts.length) {
      setFilteredPosts(posts)
      return
    }

    const filtered = posts.filter(
      (post) =>
        post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.calendarName?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredPosts(filtered)
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
  }

  const handlePostDeleted = () => {
    // Recarregar os posts quando um post for excluído
    if (selectedClient) {
      loadClientPosts(selectedClient)
    }
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
              <Link href="/admin/posts" className="transition-colors hover:text-foreground/80 text-foreground">
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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Posts</h1>
            <p className="text-muted-foreground">Visualize e gerencie todos os posts agendados</p>
          </div>
          <Link href="/admin/posts/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Post
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Posts Agendados</CardTitle>
            <CardDescription>Selecione um cliente para visualizar seus posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                  <Label>Cliente</Label>
                  {isLoadingClients ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando clientes...</span>
                    </div>
                  ) : (
                    <Select value={selectedClient || ""} onValueChange={handleClientChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length > 0 ? (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} ({client.code})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            Nenhum cliente encontrado
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="w-full md:w-2/3">
                  <Label>Buscar</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar posts..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Carregando posts...</span>
                </div>
              ) : selectedClient ? (
                filteredPosts.length > 0 ? (
                  <div
                    className={
                      viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
                    }
                  >
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        layout={viewMode === "grid" ? "default" : "horizontal"}
                        calendarColor={post.calendarColor}
                        showActions={true}
                        onDelete={handlePostDeleted}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {posts.length > 0
                      ? "Nenhum post encontrado com os filtros atuais."
                      : "Este cliente não possui posts agendados."}
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Selecione um cliente para visualizar seus posts.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// Componente Label simples para reutilização
function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {children}
    </label>
  )
}
