"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function ClientAccessCard() {
  const [clientCode, setClientCode] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (clientCode.trim()) {
      router.push(`/client/calendar/${clientCode}`)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Acesso do Cliente</CardTitle>
        <CardDescription>Digite seu código para acessar seu calendário de posts</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Input
                id="clientCode"
                placeholder="Digite seu código de acesso"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSubmit}>Acessar Calendário</Button>
      </CardFooter>
    </Card>
  )
}
