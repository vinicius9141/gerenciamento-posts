"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deletePost } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

// Update the Post interface to include calendarId
interface Post {
  id: string
  clientId: string
  calendarId: string
  date: Date
  image?: string
  imageUrl?: string
  caption: string
  status: string
  calendarName?: string
  calendarColor?: string
}

// Update the PostCardProps to include calendarColor
interface PostCardProps {
  post: Post
  layout?: "default" | "horizontal" | "instagram"
  calendarColor?: string
  showActions?: boolean
  onDelete?: () => void
}

// Update the PostCard component to show calendar indicator
export function PostCard({ post, layout = "default", calendarColor, showActions = false, onDelete }: PostCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  // Garantir que a data seja um objeto Date
  const postDate = post.date instanceof Date ? post.date : new Date(post.date)

  const handleDeletePost = async () => {
    try {
      setIsDeleting(true)
      await deletePost(post.id)
      toast({
        title: "Post excluído",
        description: "O post foi excluído com sucesso!",
      })
      if (onDelete) {
        onDelete()
      }
    } catch (error: any) {
      console.error("Error deleting post:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o post: " + (error.message || ""),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditPost = () => {
    router.push(`/admin/posts/edit/${post.id}`)
  }

  if (layout === "instagram") {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-row items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src="/placeholder.svg" alt="Avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="font-medium">username</div>
            {(calendarColor || post.calendarColor) && (
              <div
                className="ml-2 w-3 h-3 rounded-full"
                style={{ backgroundColor: calendarColor || post.calendarColor }}
                title={`Calendário: ${post.calendarName || post.calendarId}`}
              />
            )}
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative w-full aspect-square">
            <Image
              src={post.imageUrl || post.image || "/placeholder.svg?height=500&width=500"}
              alt="Post image"
              fill
              className="object-cover"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start p-4">
          <div className="flex items-center w-full mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm">
            <span className="font-medium mr-2">username</span>
            {post.caption}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Agendado para {postDate.toLocaleDateString("pt-BR")}</div>
        </CardFooter>
      </Card>
    )
  }

  if (layout === "horizontal") {
    return (
      <Card>
        <div className="flex">
          <div className="w-1/3 relative">
            <div className="relative w-full h-full min-h-[150px]">
              <Image
                src={post.imageUrl || post.image || "/placeholder.svg?height=300&width=300"}
                alt="Post image"
                fill
                className="object-cover rounded-l-lg"
              />
            </div>
          </div>
          <div className="w-2/3 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium">Agendado para {postDate.toLocaleDateString("pt-BR")}</div>
              {(calendarColor || post.calendarColor) && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: calendarColor || post.calendarColor }}
                  title={`Calendário: ${post.calendarName || post.calendarId}`}
                />
              )}
            </div>
            <div className="text-sm mb-4">{post.caption}</div>
            {showActions && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="mr-2" onClick={handleEditPost}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash className="h-4 w-4 mr-2" />
                          Excluir
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Post</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeletePost}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative w-full aspect-square">
          <Image
            src={post.imageUrl || post.image || "/placeholder.svg?height=400&width=400"}
            alt="Post image"
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4">
        <div className="flex items-center gap-2 w-full mb-2">
          <div className="text-sm font-medium">Agendado para {postDate.toLocaleDateString("pt-BR")}</div>
          {(calendarColor || post.calendarColor) && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: calendarColor || post.calendarColor }}
              title={`Calendário: ${post.calendarName || post.calendarId}`}
            />
          )}
        </div>
        <div className="text-sm mb-4 line-clamp-2">{post.caption}</div>
        {showActions && (
          <div className="flex justify-end w-full">
            <Button variant="outline" size="sm" className="mr-2" onClick={handleEditPost}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4 mr-2" />
                      Excluir
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePost}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
