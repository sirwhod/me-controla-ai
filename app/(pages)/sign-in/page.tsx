"use client"

import { PiggyBank } from "lucide-react"

import { LoginForm } from "@/app/components/login-form"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { redirect } from "next/navigation"

export default function LoginPage() {
  const { status } = useSession()
  
  useEffect(() => {
    if (status === 'authenticated') {
      redirect('/dashboard')
    }
  }, [status])
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <PiggyBank className="size-4" />
          </div>
          MeControla.AI
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
