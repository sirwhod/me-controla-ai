import {
  Users,
  CreditCard,
  Target,
  BarChart3,
  CalendarDays,
  Split,
  Sparkles,
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Caixinhas Pessoais & Compartilhadas",
    description:
      "Crie espaços separados para suas finanças individuais, para despesas da casa com seu parceiro(a) ou para projetos específicos. Isolamento completo de dados com troca em um clique.",
    badge: "Exclusivo",
  },
  {
    icon: CreditCard,
    title: "Inteligência de Fatura & Cartões",
    description:
      "Cadastre o dia de fechamento e vencimento de seus cartões. O sistema projeta automaticamente se a compra entrará na fatura atual ou do mês seguinte, evitando sustos.",
    badge: "Automação",
  },
  {
    icon: Split,
    title: "Gestão Inteligente de Parcelamentos",
    description:
      "Lance compras parceladas (ex: 10x de R$ 150) e acompanhe o progresso mês a mês (1/10, 2/10...), com geração automática de todo o cronograma no seu extrato.",
    badge: "Praticidade",
  },
  {
    icon: Target,
    title: "Metas Financeiras com Progresso Visual",
    description:
      "Defina objetivos claros como Reserva de Emergência, Viagens ou Investimentos. Monitore percentuais de conquista e prazos em tempo real.",
    badge: "Foco",
  },
  {
    icon: CalendarDays,
    title: "Despesas Fixas & Assinaturas",
    description:
      "Automatize cobranças mensais recorrentes (aluguel, condomínio, streaming). Saiba exatamente quanto do seu orçamento já está comprometido antes do mês começar.",
    badge: "Previsibilidade",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analítico Consolidado",
    description:
      "Gráficos intuitivos de evolução mensal, distribuição por métodos de pagamento (Pix, Crédito, Débito) e comparativo de despesas por categoria.",
    badge: "Visão 360°",
  },
]

export function LandingFeatures() {
  return (
    <section id="recursos" className="py-20 border-t border-border/40 bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Recursos Poderosos
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Tudo o que você precisa para dominar suas finanças
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Desenvolvido para oferecer máxima clareza, automação e facilidade no dia a dia.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, index) => {
            const Icon = feat.icon
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {feat.title}
                </h3>

                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                  {feat.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
