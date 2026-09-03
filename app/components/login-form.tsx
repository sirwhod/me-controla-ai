'use client'

import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { registerAction } from "@/app/actions/register-action"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Campos de Login / Cadastro
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  // Feedback do OAuth via URL
  const displayedError =
    errorMessage ||
    (urlError === "OAuthAccountNotLinked"
      ? "Este e-mail já está associado a outro método de login."
      : urlError === "CredentialsSignin"
      ? "E-mail ou senha incorretos."
      : urlError === "OAuthSignin" || urlError === "Callback"
      ? "Não foi possível autenticar com o Google. Verifique as credenciais."
      : null)

  async function handleGoogleSignIn() {
    try {
      setErrorMessage(null)
      setIsLoading(true)
      await signIn("google", { callbackUrl })
    } catch (err) {
      console.error("Erro ao iniciar login com Google:", err)
      setErrorMessage("Erro ao conectar com Google. Tente novamente.")
      setIsLoading(false)
    }
  }

  async function handleEmailPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (mode === "register") {
      if (password !== confirmPassword) {
        setErrorMessage("As senhas informadas não coincidem.")
        return
      }

      if (password.length < 6) {
        setErrorMessage("A senha deve ter pelo menos 6 caracteres.")
        return
      }

      try {
        setIsLoading(true)
        const result = await registerAction({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        })

        if (!result.success) {
          setErrorMessage(result.message)
          setIsLoading(false)
          return
        }

        setSuccessMessage("Conta criada com sucesso! Entrando...")
        
        // Login automático após cadastro
        const loginResult = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        })

        if (loginResult?.error) {
          setSuccessMessage("Conta criada! Por favor, faça login com seus dados.")
          setMode("login")
          setPassword("")
          setConfirmPassword("")
          setIsLoading(false)
        } else {
          router.push(callbackUrl)
        }
      } catch (err) {
        console.error("Erro no cadastro:", err)
        setErrorMessage("Ocorreu um erro ao criar a conta. Tente novamente.")
        setIsLoading(false)
      }
    } else {
      // Modo Login
      try {
        setIsLoading(true)
        const result = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        })

        if (result?.error) {
          setErrorMessage("E-mail ou senha incorretos.")
          setIsLoading(false)
        } else {
          router.push(callbackUrl)
        }
      } catch (err) {
        console.error("Erro no login:", err)
        setErrorMessage("Ocorreu um erro ao tentar entrar. Tente novamente.")
        setIsLoading(false)
      }
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          {mode === "login"
            ? "Acesse suas caixinhas e acompanhe sua vida financeira."
            : "Comece a organizar suas finanças de forma simples e inteligente."}
        </p>
      </div>

      {displayedError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-success/10 text-success border border-success/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Formulário de Email e Senha */}
      <form onSubmit={handleEmailPasswordSubmit} className="flex flex-col gap-4">
        {mode === "register" && (
          <div className="grid gap-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {mode === "register" && (
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        )}

        <Button type="submit" className="w-full h-10 font-medium" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === "login" ? "Entrando..." : "Criando conta..."}
            </>
          ) : mode === "login" ? (
            "Entrar"
          ) : (
            "Cadastrar"
          )}
        </Button>
      </form>

      {/* Divisor */}
      <div className="relative text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">
          Ou continue com
        </span>
      </div>

      {/* Botão Google */}
      <Button
        variant="outline"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full h-10 font-medium shadow-xs"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="currentColor"
          />
        </svg>
        Continuar com Google
      </Button>

      {/* Alternância Login / Cadastro */}
      <div className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Não tem uma conta?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("register")
                setErrorMessage(null)
              }}
              className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
            >
              Cadastre-se
            </button>
          </>
        ) : (
          <>
            Já possui uma conta?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setErrorMessage(null)
              }}
              className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
            >
              Fazer login
            </button>
          </>
        )}
      </div>

      <div className="text-muted-foreground text-center text-xs text-balance">
        Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade do MeControla.AI.
      </div>
    </div>
  )
}
