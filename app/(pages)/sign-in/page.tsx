"use client"

import { LoginForm } from "@/app/components/login-form"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { redirect } from "next/navigation"
import Image from "next/image"

import Logo from "@/public/logo.svg"

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
          <Image src={Logo} alt="" width={24} height={24} />
          MeControla.AI
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
