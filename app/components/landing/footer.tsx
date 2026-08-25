import Link from "next/link"
import { Logo } from "../logo"
import { ShieldCheck, Heart } from "lucide-react"

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-background py-12 text-sm text-muted-foreground">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-7 w-7 text-primary" />
              <span className="text-lg font-bold tracking-tight text-foreground">
                MeControla<span className="text-primary">.AI</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-xs text-muted-foreground leading-relaxed">
              A plataforma inteligente para gestão de finanças pessoais e caixinhas compartilhadas. Clareza, previsibilidade e crescimento para o seu dinheiro.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Ambiente 100% criptografado e seguro</span>
            </div>
          </div>

          {/* Col 2: Navegação */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Navegação</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a href="#recursos" className="hover:text-primary transition-colors">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-primary transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#diferenciais" className="hover:text-primary transition-colors">
                  Diferenciais
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  Dúvidas Frequentes
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Acesso & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Acesso Rápido</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/sign-in" className="hover:text-primary transition-colors">
                  Entrar na Conta
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-primary transition-colors font-semibold text-primary">
                  Criar Conta Grátis
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/80">Termos de Uso</span>
              </li>
              <li>
                <span className="text-muted-foreground/80">Política de Privacidade</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 sm:flex-row text-xs">
          <p>© {currentYear} MeControla.AI. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Feito com <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> para sua liberdade financeira.
          </p>
        </div>
      </div>
    </footer>
  )
}
