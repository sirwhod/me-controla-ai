"use client"

import { LoginForm } from "@/app/components/login-form"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { redirect } from "next/navigation"
import Image from "next/image"

import Placeholder from "@/public/placeholder.svg"
import Logo from "@/public/logo.svg"

export default function LoginPage() {
  const { status } = useSession()
  
  useEffect(() => {
    if (status === 'authenticated') {
      redirect('/dashboard')
    }
  }, [status])
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center gap-2 md:justify-start">
        <a href="#" className="flex items-center gap-2 font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Image src={Logo} alt="" width={24} height={24} />
          </div>
          MeControla.AI
        </a>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xs">
          <LoginForm />
        </div>
      </div>
    </div>
    <div className="relative hidden bg-muted lg:block">
      <Image
        src={Placeholder}
        alt="Image"
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  </div>
  )
}