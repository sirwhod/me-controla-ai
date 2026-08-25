import { UserPlus, WalletCards, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "../ui/button"

const steps = [
  {
    step: "01",
    title: "Crie sua conta em segundos",
    description:
      "Faça seu cadastro com e-mail ou Google e ganhe instantaneamente 7 dias de acesso completo a todos os recursos da plataforma.",
    icon: UserPlus,
  },
  {
    step: "02",
    title: "Configure suas caixinhas e cartões",
    description:
      "Personalize suas caixinhas individuais e compartilhadas, cadastre seus bancos e defina o dia de fechamento de suas faturas.",
    icon: WalletCards,
  },
  {
    step: "03",
    title: "Controle e multiplique seu patrimônio",
    description:
      "Acompanhe suas receitas, controle gastos no débito, crédito ou Pix, e veja suas metas financeiras sendo alcançadas mês a mês.",
    icon: TrendingUp,
  },
]

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="py-20 border-t border-border/40">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            Simples & Direto
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Como o MeControla.AI transforma suas finanças em 3 passos
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Sem burocracia, sem sincronizações bancárias invasivas. Controle seguro e total transparência.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="relative flex flex-col items-center text-center rounded-2xl border border-border/70 bg-card p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-4 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground shadow-md">
                  Passo {item.step}
                </div>

                <div className="mt-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-foreground">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Action Callout */}
        <div className="mt-14 flex justify-center">
          <Link href="/sign-in">
            <Button size="lg" className="gap-2 font-bold px-8 shadow-md hover:scale-105 transition-all">
              Começar Agora Gratuitamente
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
