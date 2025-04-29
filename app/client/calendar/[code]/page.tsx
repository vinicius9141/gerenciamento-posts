"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Grid, List, Instagram } from "lucide-react"
import { PostCard } from "@/components/post-card"
import { Badge } from "@/components/ui/badge"
import { getClientByCode, getPostsByClient } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

export default function ClientCalendar() {
  const params = useParams()
  const clientCode = params.code as string
  const [viewMode, setViewMode] = useState("calendar")
  const [calendarType, setCalendarType] = useState("weekly")
  const [date, setDate] = useState<Date>(new Date())
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([])
  const [clientData, setClientData] = useState<{
    id: string
    name: string
    calendars: { id: string; name: string; color: string }[]
  } | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadClientData()
  }, [clientCode])

  const loadClientData = async () => {
    try {
      setIsLoading(true)
      const client = await getClientByCode(clientCode)

      if (!client) {
        toast({
          title: "Erro",
          description: "Cliente não encontrado",
          variant: "destructive",
        })
        return
      }

      setClientData(client as any)

      // Set all calendars as selected by default
      if (client.calendars && client.calendars.length > 0) {
        setSelectedCalendars(client.calendars.map((cal: any) => cal.id))
      }

      // Load posts
      const clientPosts = await getPostsByClient(client.id)
      setPosts(clientPosts)
    } catch (error) {
      console.error("Error loading client data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a function to toggle calendar selection
  const toggleCalendar = (calendarId: string) => {
    setSelectedCalendars((prev) =>
      prev.includes(calendarId) ? prev.filter((id) => id !== calendarId) : [...prev, calendarId],
    )
  }

  // Filter posts based on selected calendars
  const filteredPosts = posts.filter((post) => selectedCalendars.includes(post.calendarId))

  if (isLoading) {
    return <div className="container py-12 text-center">Carregando...</div>
  }

  if (!clientData) {
    return <div className="container py-12 text-center">Cliente não encontrado</div>
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário de Posts</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {clientData.name} (Código: {clientCode})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={calendarType} onValueChange={setCalendarType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Calendário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="halfyearly">Semestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "feed" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("feed")}>
              <Instagram className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {clientData?.calendars.map((calendar) => (
          <Badge
            key={calendar.id}
            variant={selectedCalendars.includes(calendar.id) ? "default" : "outline"}
            className="cursor-pointer"
            style={{
              backgroundColor: selectedCalendars.includes(calendar.id) ? calendar.color : "transparent",
              color: selectedCalendars.includes(calendar.id) ? "white" : calendar.color,
              borderColor: calendar.color,
            }}
            onClick={() => toggleCalendar(calendar.id)}
          >
            {calendar.name}
          </Badge>
        ))}
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="posts">Posts Agendados</TabsTrigger>
          <TabsTrigger value="feed">Feed do Instagram</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          {viewMode === "calendar" && (
            <Card>
              <CardHeader>
                <CardTitle>Calendário de Posts</CardTitle>
                <CardDescription>
                  Visualize seus posts agendados no calendário{" "}
                  {calendarType === "weekly"
                    ? "semanal"
                    : calendarType === "monthly"
                      ? "mensal"
                      : calendarType === "quarterly"
                        ? "trimestral"
                        : calendarType === "halfyearly"
                          ? "semestral"
                          : "anual"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  className="rounded-md border"
                />
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Posts para {date.toLocaleDateString("pt-BR")}</h3>
                  <div className="grid gap-4">
                    {filteredPosts
                      .filter(
                        (post) =>
                          post.date.getDate() === date.getDate() &&
                          post.date.getMonth() === date.getMonth() &&
                          post.date.getFullYear() === date.getFullYear(),
                      )
                      .map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          calendarColor={clientData?.calendars.find((cal) => cal.id === post.calendarId)?.color}
                        />
                      ))}
                    {filteredPosts.filter(
                      (post) =>
                        post.date.getDate() === date.getDate() &&
                        post.date.getMonth() === date.getMonth() &&
                        post.date.getFullYear() === date.getFullYear(),
                    ).length === 0 && <p className="text-muted-foreground">Nenhum post agendado para esta data.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  calendarColor={clientData?.calendars.find((cal) => cal.id === post.calendarId)?.color}
                />
              ))}
              {filteredPosts.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Nenhum post agendado para os calendários selecionados.
                </div>
              )}
            </div>
          )}

          {viewMode === "list" && (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  layout="horizontal"
                  calendarColor={clientData?.calendars.find((cal) => cal.id === post.calendarId)?.color}
                />
              ))}
              {filteredPosts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum post agendado para os calendários selecionados.
                </div>
              )}
            </div>
          )}

          {viewMode === "feed" && (
            <div className="max-w-md mx-auto">
              <div className="grid gap-4">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    layout="instagram"
                    calendarColor={clientData?.calendars.find((cal) => cal.id === post.calendarId)?.color}
                  />
                ))}
                {filteredPosts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum post agendado para os calendários selecionados.
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="feed">
          <Card>
            <CardHeader>
              <CardTitle>Feed do Instagram</CardTitle>
              <CardDescription>Visualize como seus posts aparecerão no Instagram</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <div className="grid gap-4">
                  {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} layout="instagram" />
                  ))}
                  {filteredPosts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum post agendado para os calendários selecionados.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
