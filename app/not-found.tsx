import Link from "next/link"
import { ArrowLeft, SearchX } from "lucide-react"

import { Button } from "@/app/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <section className="flex w-full max-w-lg flex-col items-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-xs">
          <SearchX aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary">Erro 404</p>
          <h1 className="text-3xl font-bold tracking-tight">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            O endereço informado não existe ou não está mais disponível.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <ArrowLeft data-icon="inline-start" />
            Voltar ao início
          </Link>
        </Button>
      </section>
    </main>
  )
}
