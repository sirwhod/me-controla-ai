import { Logo } from "../components/logo"
import { Button } from "../components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 justify-center items-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Seja Bem-vindo!</h1>
        <p className="leading-7 [&:not(:first-child)]:mt-6">A primeira versão da landing page do MeControla.AI</p>
        <div className="flex flex-row gap-2 items-center justify-center">
          <Logo className="text-primary w-8 h-8" />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">MeControla.AI</span>
            <span className="truncate text-xs">
              Aplicativo de gestão financeira.
            </span>
          </div>
        </div>
        <Link href={'/sign-in'} className="w-full cursor-pointer">
          <Button className="w-full">
            Entrar
          </Button>
        </Link>
      </div>
    </div>
  )
}
