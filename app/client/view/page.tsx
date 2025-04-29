"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight } from "lucide-react"
import { getClientByCode } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

export default function ClientView() {
  const [clientCode, setClientCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!clientCode.trim()) {
      setError("Por favor, digite seu código de acesso")
      return
    }

    try {
      setIsLoading(true)
      const client = await getClientByCode(clientCode)

      if (!client) {
        setError("Código de cliente não encontrado")
        return
      }

      toast({
        title: "Acesso concedido",
        description: `Bem-vindo, ${client.name}!`,
      })

      router.push(`/client/calendar/${clientCode}`)
    } catch (err: any) {
      console.error(err)
      setError("Erro ao verificar o código. " + (err.message || ""))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Acesso do Cliente</CardTitle>
          <CardDescription>Digite seu código de acesso para visualizar seu calendário de posts</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Input
                  id="clientCode"
                  placeholder="Código de acesso"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verificando..." : "Acessar Calendário"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          O código de acesso é fornecido pelo administrador do sistema
        </CardFooter>
      </Card>
    </div>
  )
}
