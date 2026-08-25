import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Mariana & Lucas S.",
    role: "Casal • São Paulo, SP",
    quote:
      "As Caixinhas Compartilhadas salvaram o nosso planejamento financeiro! Dividimos as despesas de casa sem misturar com os nossos gastos individuais. Ficou muito mais leve e organizado.",
    avatar: "M&L",
    rating: 5,
  },
  {
    name: "Carlos Eduardo P.",
    role: "Engenheiro de Software • Curitiba, PR",
    quote:
      "A regra inteligente de fechamento de fatura me fez economizar centenas de reais em juros e imprevistos. Sei exatamente o que vai cair neste mês e no próximo.",
    avatar: "CE",
    rating: 5,
  },
  {
    name: "Fernanda Costa",
    role: "Arquiteta Autônoma • Belo Horizonte, MG",
    quote:
      "Eu tinha pânico de abrir planilhas no Excel. O MeControla.AI é direto ao ponto, rápido no celular e me deu a tranquilidade de atingir minha Reserva de Emergência em 6 meses.",
    avatar: "FC",
    rating: 5,
  },
]

export function LandingTestimonials() {
  return (
    <section id="diferenciais" className="py-20 border-t border-border/40 bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            Histórias de Sucesso
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Quem usa, recomenda e não volta para planilhas
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Descubra como o MeControla.AI está transformando a relação de milhares de pessoas com seu dinheiro.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="mt-4 text-sm text-foreground/90 leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground">
                  {item.avatar}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
