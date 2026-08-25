'use client'

import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true)
      await signIn('google', { callbackUrl })
    } catch (err) {
      console.error("Erro ao iniciar login com Google:", err)
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Entre na sua conta</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Acesse suas caixinhas e gerencie suas finanças de forma simples e inteligente.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {error === "OAuthAccountNotLinked"
              ? "Este e-mail já está associado a outro método de login."
              : error === "OAuthSignin" || error === "Callback"
              ? "Não foi possível autenticar com o Google. Verifique se as credenciais OAuth estão configuradas."
              : "Ocorreu um erro ao tentar realizar o login. Tente novamente."}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full h-11 font-medium shadow-xs hover:bg-accent"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Conectando ao Google...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continuar com Google
            </>
          )}
        </Button>
      </div>

      <div className="text-muted-foreground text-center text-xs text-balance">
        Ao entrar, você está aceitando os{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Termos de Serviço
        </a>{" "}
        e a{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Política de Privacidade
        </a>
        .
      </div>
    </div>
  )
}
