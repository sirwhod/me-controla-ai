import { ArrowUpRight, ArrowDownRight, CreditCard, Sparkles, Target, Users, ShieldCheck, Wallet } from "lucide-react"

export function LandingDashboardPreview() {
  return (
    <div className="relative mx-auto max-w-5xl rounded-2xl border border-border/70 bg-card/60 p-3 sm:p-5 shadow-2xl backdrop-blur-xl transition-all">
      {/* Top Window Bar Mockup */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-xs font-medium text-muted-foreground hidden sm:inline">
            mecontrola.ai/dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            <Sparkles className="h-3 w-3" />
            Caixinha Pessoal Ativa
          </span>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Balanço */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Balanço do Período
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-500">
            R$ 4.400,00
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Superávit financeiro</span>
          </div>
        </div>

        {/* Receitas */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Receitas Totais
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            + R$ 5.000,00
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            1 entrada lançada
          </div>
        </div>

        {/* Despesas */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Despesas Totais
            </span>
            <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            - R$ 600,00
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            2 despesas no mês
          </div>
        </div>

        {/* Fatura Cartão */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Fatura Nubank
            </span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-500">
            R$ 150,00
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Fecha dia 10 • Vence dia 17
          </div>
        </div>
      </div>

      {/* Middle Interactive Comparison Rows */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Financial Goals */}
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Metas em Andamento</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">25% atingido</span>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">Reserva de Emergência</span>
                <span className="text-primary font-bold">R$ 2.500 / R$ 10.000</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: "25%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">Viagem de Fim de Ano</span>
                <span className="text-primary font-bold">R$ 4.200 / R$ 6.000</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: "70%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Shared Workspaces Showcase */}
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Caixinhas Ativas</span>
            </div>
            <span className="text-xs text-muted-foreground">Isolamento total</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-semibold text-foreground">Caixinha Pessoal</span>
              </div>
              <span className="font-bold text-foreground">R$ 4.400,00</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span className="font-medium text-foreground">Casal & Casa (Compartilhada)</span>
              </div>
              <span className="font-bold text-foreground">R$ 1.850,00</span>
            </div>
          </div>
        </div>

        {/* Right: Security & Automation Highlight */}
        <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-foreground">Automação & Previsibilidade</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Lançamentos parcelados ($1/12$), despesas fixas e fechamento automático de faturas sincronizados em tempo real.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
            <span>Parcelamento Ativo:</span>
            <span className="font-bold text-foreground">Notebook 3x R$ 1.000</span>
          </div>
        </div>
      </div>
    </div>
  )
}
