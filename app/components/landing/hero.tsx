import Link from "next/link"
import { Button } from "../ui/button"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { LandingDashboardPreview } from "./dashboard-preview"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px] dark:bg-primary/10" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top Floating Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-sm transition-transform hover:scale-105">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gestão Financeira Inteligente com Caixinhas Compartilhadas</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="mx-auto mt-6 max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl sm:leading-[1.15]">
            Assuma o controle do seu dinheiro{" "}
            <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
              sem planilhas complicadas
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Organize despesas pessoais, divida gastos em casal com <strong>Caixinhas Compartilhadas</strong>, acompanhe faturas de cartão de crédito e alcance suas metas financeiras com total clareza.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/sign-in" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 text-base font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 sm:w-auto px-8 py-6">
              Começar Teste Grátis de 7 Dias
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/sign-in" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full gap-2 text-base font-semibold sm:w-auto px-8 py-6">
              Acessar Minha Conta
            </Button>
          </Link>
        </div>

        {/* Micro-proof Under Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>7 dias de teste grátis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Sem necessidade de cartão para começar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Acesso instantâneo e seguro</span>
          </div>
        </div>

        {/* Mockup Showcase */}
        <div className="mt-14 sm:mt-18">
          <LandingDashboardPreview />
        </div>
      </div>
    </section>
  )
}
