import Link from "next/link"
import { Button } from "../ui/button"
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react"

export function LandingCTA() {
  return (
    <section className="py-20 border-t border-border/40 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />

      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative rounded-3xl border border-primary/40 bg-gradient-to-b from-card to-background p-8 sm:p-14 shadow-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-bold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            7 Dias de Acesso Gratuito
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Pronto para transformar sua vida financeira?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Junte-se a quem já conquistou clareza, tranquilidade e controle total sobre cada centavo. Comece agora mesmo, é rápido e grátis.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 text-base font-bold shadow-xl shadow-primary/25 hover:scale-105 transition-all px-9 py-6 sm:w-auto">
                Criar Minha Conta Grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-base font-semibold px-8 py-6 sm:w-auto">
                Já Tenho Conta
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Sem cobrança automática</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Cancelamento a qualquer momento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Suporte humanizado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
