"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, ImagePlus, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAllClients, getPostById, updatePost } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

export default function EditPost() {
  const params = useParams()
  const postId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [post, setPost] = useState<any>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [client, setClient] = useState("")
  const [caption, setCaption] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null)
  const [clientCalendars, setClientCalendars] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPost()
    loadClients()
  }, [postId])

  useEffect(() => {
    if (client) {
      const selectedClient = clients.find((c) => c.id === client)
      if (selectedClient && selectedClient.calendars) {
        setClientCalendars(selectedClient.calendars || [])
      } else {
        setClientCalendars([])
      }
    }
  }, [client, clients])

  const loadPost = async () => {
    try {
      setIsLoadingPost(true)
      const postData = await getPostById(postId)

      if (!postData) {
        toast({
          title: "Erro",
          description: "Post não encontrado",
          variant: "destructive",
        })
        router.push("/admin/posts")
        return
      }

      setPost(postData)
      setClient(postData.clientId)
      setCaption(postData.caption || "")
      setDate(postData.date)
      setSelectedCalendar(postData.calendarId)
      setImagePreview(postData.imageUrl)
    } catch (error: any) {
      console.error("Error loading post:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o post: " + (error.message || ""),
        variant: "destructive",
      })
    } finally {
      setIsLoadingPost(false)
    }
  }

  const loadClients = async () => {
    try {
      setIsLoadingClients(true)
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
      setIsLoadingClients(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Verificar o tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("A imagem deve ter no máximo 2MB")
        return
      }

      // Verificar o tipo do arquivo
      if (!file.type.startsWith("image/")) {
        setError("O arquivo deve ser uma imagem")
        return
      }

      setError(null)
      setImageFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClientChange = (clientId: string) => {
    setClient(clientId)
    setSelectedCalendar(null) // Reset selected calendar when client changes

    const selectedClient = clients.find((c) => c.id === clientId)
    if (selectedClient && selectedClient.calendars) {
      setClientCalendars(selectedClient.calendars || [])
    } else {
      setClientCalendars([])
    }
  }

  const validateForm = () => {
    if (!client) {
      setError("Selecione um cliente")
      return false
    }

    if (!selectedCalendar) {
      setError("Selecione um calendário")
      return false
    }

    if (!date) {
      setError("Selecione uma data para o post")
      return false
    }

    if (!caption.trim()) {
      setError("Digite uma legenda para o post")
      return false
    }

    setError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      if (!date || !selectedCalendar) {
        return
      }

      // Obter informações do calendário selecionado
      const selectedClientData = clients.find((c) => c.id === client)
      const calendarData = selectedClientData?.calendars?.find((cal: any) => cal.id === selectedCalendar)

      const updateData: any = {
        clientId: client,
        calendarId: selectedCalendar,
        caption,
        date,
      }

      if (calendarData) {
        updateData.calendarName = calendarData.name
        updateData.calendarColor = calendarData.color
      }

      // Se houver uma nova imagem, fazer upload
      if (imageFile) {
        updateData.imageFile = imageFile
      }

      await updatePost(postId, updateData)

      toast({
        title: "Post atualizado",
        description: "O post foi atualizado com sucesso!",
      })

      router.push("/admin/posts")
    } catch (error: any) {
      console.error("Error updating post:", error)
      let errorMessage = "Erro ao atualizar o post"

      if (error.code === "storage/unauthorized") {
        errorMessage = "Erro de permissão ao fazer upload da imagem. Por favor, contate o administrador."
      } else if (error.message) {
        errorMessage += ": " + error.message
      }

      setError(errorMessage)

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  if (isLoadingPost) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link href="/admin/dashboard" className="mr-6 flex items-center space-x-2">
                <span className="font-bold">PostScheduler Admin</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 container py-8 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg">Carregando post...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/admin/dashboard" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">PostScheduler Admin</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                Sair
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <div className="flex items-center mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight ml-4">Editar Post</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Post</CardTitle>
                <CardDescription>Edite os detalhes do post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  {isLoadingClients ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando clientes...</span>
                    </div>
                  ) : (
                    <Select value={client} onValueChange={handleClientChange}>
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
                <div className="space-y-2">
                  <Label>Calendário</Label>
                  {clientCalendars.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {clientCalendars.map((calendar) => (
                        <Badge
                          key={calendar.id}
                          variant={selectedCalendar === calendar.id ? "default" : "outline"}
                          className="cursor-pointer"
                          style={{
                            backgroundColor: selectedCalendar === calendar.id ? calendar.color : "transparent",
                            color: selectedCalendar === calendar.id ? "white" : calendar.color,
                            borderColor: calendar.color,
                          }}
                          onClick={() => setSelectedCalendar(calendar.id)}
                        >
                          {calendar.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {client ? "Este cliente não possui calendários" : "Selecione um cliente primeiro"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data de Publicação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption">Legenda</Label>
                  <Textarea
                    id="caption"
                    placeholder="Digite a legenda do post..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imagem do Post</CardTitle>
                <CardDescription>Mantenha a imagem atual ou faça upload de uma nova (máximo 2MB)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 h-[300px]">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null)
                          setImageFile(null)
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center text-center cursor-pointer w-full h-full"
                      onClick={triggerFileInput}
                    >
                      <ImagePlus className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="mb-2 text-sm font-semibold">Clique para fazer upload</p>
                      <p className="text-xs text-muted-foreground mb-4">SVG, PNG, JPG ou GIF (max. 2MB)</p>
                      <input
                        ref={fileInputRef}
                        id="image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button type="button" variant="outline" onClick={triggerFileInput}>
                        Selecionar Imagem
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button type="button" variant="outline" asChild disabled={isLoading}>
              <Link href="/admin/posts">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
