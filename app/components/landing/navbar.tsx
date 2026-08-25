"use client"

import Link from "next/link"
import { Logo } from "../logo"
import { Button } from "../ui/button"
import { ArrowRight, Menu, X, Sparkles } from "lucide-react"
import { useState } from "react"

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <Logo className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">
              MeControla<span className="text-primary">.AI</span>
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">
              Gestão Financeira
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#recursos" className="transition hover:text-foreground hover:text-primary">
            Recursos
          </a>
          <a href="#como-funciona" className="transition hover:text-foreground hover:text-primary">
            Como Funciona
          </a>
          <a href="#diferenciais" className="transition hover:text-foreground hover:text-primary">
            Diferenciais
          </a>
          <a href="#faq" className="transition hover:text-foreground hover:text-primary">
            Dúvidas (FAQ)
          </a>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="font-medium text-sm">
              Entrar
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="sm" className="gap-1.5 font-semibold shadow-sm transition-all hover:shadow-primary/20 hover:scale-[1.02]">
              <Sparkles className="h-3.5 w-3.5" />
              Experimente Grátis
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none"
          aria-label="Abrir menu de navegação"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 md:hidden animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-4 text-sm font-medium">
            <a
              href="#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-primary"
            >
              Recursos
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-primary"
            >
              Como Funciona
            </a>
            <a
              href="#diferenciais"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-primary"
            >
              Diferenciais
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-primary"
            >
              Dúvidas (FAQ)
            </a>
            <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Entrar
                </Button>
              </Link>
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center gap-2 font-semibold">
                  Começar 7 Dias Grátis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
