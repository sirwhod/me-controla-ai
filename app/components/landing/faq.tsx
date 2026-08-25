"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

const faqs = [
  {
    question: "Como funciona o período de teste grátis de 7 dias?",
    answer:
      "Ao se cadastrar no MeControla.AI, você recebe automaticamente 7 dias de acesso total e irrestrito a todas as funcionalidades: Caixinhas Pessoais e Compartilhadas, relatórios analíticos, projeções de cartão e controle de metas. Não é necessário cartão de crédito para iniciar.",
  },
  {
    question: "O que são as Caixinhas Compartilhadas?",
    answer:
      "As Caixinhas Compartilhadas são workspaces onde você pode convidar outras pessoas (como seu cônjuge, sócios ou amigos) para gerenciar despesas conjuntas de forma totalmente separada da sua Caixinha Pessoal. Você pode alternar entre elas instantaneamente no topo da tela.",
  },
  {
    question: "Como o sistema calcula as faturas de Cartão de Crédito?",
    answer:
      "Basta informar o dia de fechamento e vencimento de cada banco/cartão. Quando você lança uma compra após o dia de fechamento, o sistema projeta e inclui a despesa automaticamente na fatura do mês seguinte.",
  },
  {
    question: "Posso lançar compras parceladas?",
    answer:
      "Sim! Você pode cadastrar uma compra em até dezenas de vezes (ex: 12x de R$ 100). O MeControla.AI gera automaticamente todas as parcelas no seu extrato e atualiza o seu orçamento futuro mês a mês.",
  },
  {
    question: "Meus dados financeiros estão seguros?",
    answer:
      "Sim! Utilizamos infraestrutura em nuvem de ponta (Google Cloud / Firebase), criptografia de dados em trânsito e em repouso, senhas hasheadas com algoritmos industriais (bcrypt) e isolamento rigoroso de permissões por workspace.",
  },
  {
    question: "Posso acessar pelo celular?",
    answer:
      "Com certeza! O MeControla.AI é 100% responsivo e otimizado para funcionar perfeitamente em smartphones, tablets e computadores, inclusive com suporte a Progressive Web App (PWA).",
  },
]

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="py-20 border-t border-border/40">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            Tire Suas Dúvidas
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Perguntas Frequentes (FAQ)
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Tudo o que você precisa saber sobre a experiência no MeControla.AI.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-border/70 bg-card transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-base font-semibold text-foreground hover:text-primary transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed animate-in fade-in-50 duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
