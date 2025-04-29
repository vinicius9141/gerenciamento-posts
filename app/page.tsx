import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClientAccessCard } from "@/components/client-access-card"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">PostScheduler</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/about" className="transition-colors hover:text-foreground/80">
                Sobre
              </Link>
              <Link href="/contact" className="transition-colors hover:text-foreground/80">
                Contato
              </Link>
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/admin/login">
              <Button variant="outline">Admin</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Gerencie seus posts de forma eficiente
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Agende posts para suas redes sociais com facilidade. Visualize seu calendário e mantenha sua
                    presença online organizada.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/client/view">
                    <Button className="px-8">Ver meu calendário</Button>
                  </Link>
                </div>
              </div>
              <ClientAccessCard />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} PostScheduler. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
