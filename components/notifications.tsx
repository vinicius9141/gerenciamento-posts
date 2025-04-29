"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getTodayPosts, markNotificationAsSeen, getSeenNotifications } from "@/lib/firebase"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

interface Post {
  id: string
  clientId: string
  calendarId: string
  calendarName?: string
  calendarColor?: string
  caption: string
  date: Date
  imageUrl: string
  status: string
}

export function NotificationsPopover() {
  const [posts, setPosts] = useState<Post[]>([])
  const [seenPostIds, setSeenPostIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTodayPosts()
    loadSeenNotifications()
  }, [])

  const loadTodayPosts = async () => {
    try {
      setIsLoading(true)
      const todayPosts = await getTodayPosts()
      setPosts(todayPosts as Post[])
    } catch (error) {
      console.error("Error loading today's posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSeenNotifications = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const seenNotifications = await getSeenNotifications(userId)
      setSeenPostIds(seenNotifications.map((n) => n.postId))
    } catch (error) {
      console.error("Error loading seen notifications:", error)
    }
  }

  const handleMarkAsSeen = async (postId: string) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para marcar notificações como vistas",
          variant: "destructive",
        })
        return
      }

      await markNotificationAsSeen(postId, userId)
      setSeenPostIds((prev) => [...prev, postId])

      toast({
        title: "Notificação marcada como vista",
        description: "Você não será mais notificado sobre este post",
      })
    } catch (error) {
      console.error("Error marking notification as seen:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como vista",
        variant: "destructive",
      })
    }
  }

  const handleDismissAll = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      // Marcar todas as notificações como vistas
      for (const post of posts) {
        if (!seenPostIds.includes(post.id)) {
          await markNotificationAsSeen(post.id, userId)
        }
      }

      setSeenPostIds(posts.map((post) => post.id))

      toast({
        title: "Todas as notificações marcadas como vistas",
        description: "Você não será mais notificado sobre estes posts",
      })
    } catch (error) {
      console.error("Error dismissing all notifications:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como vistas",
        variant: "destructive",
      })
    }
  }

  const unreadCount = posts.filter((post) => !seenPostIds.includes(post.id)).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-medium text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDismissAll}>
              Marcar todas como vistas
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Carregando notificações...</div>
          ) : posts.length > 0 ? (
            <div>
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={`p-4 border-b last:border-b-0 ${seenPostIds.includes(post.id) ? "bg-muted/30" : "bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Post agendado para hoje</span>
                        {post.calendarName && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: post.calendarColor || "#888" }}
                            title={post.calendarName}
                          />
                        )}
                      </div>
                      <p className="text-sm line-clamp-2 mb-1">{post.caption}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.date.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {post.calendarName && <span className="ml-2">• {post.calendarName}</span>}
                      </div>
                    </div>
                    {!seenPostIds.includes(post.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleMarkAsSeen(post.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">Não há posts agendados para hoje.</div>
          )}
        </div>
        {posts.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/admin/posts">Ver todos os posts</a>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
