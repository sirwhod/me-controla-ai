import { PiggyBank } from "lucide-react"
import { Button } from "../components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Seja Bem-vindo!</h1>
        <p className="leading-7 [&:not(:first-child)]:mt-6">A primeira versão da landing page do MeControla.AI</p>
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <PiggyBank className="size-4" />
          </div>
          MeControla.AI
        </a>
        <Button>
          <Link href={'/sign-in'}>Entrar</Link>
        </Button>
      </div>
    </div>
  )
}
