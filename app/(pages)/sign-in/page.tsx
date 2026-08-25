"use client"

import { LoginForm } from "@/app/components/login-form"
import { useSession } from "next-auth/react"
import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import Placeholder from "@/public/placeholder.svg"
import { Logo } from "@/app/components/logo"
import { Skeleton } from "@/app/components/ui/skeleton"

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md">
              <Logo className="text-primary" />
            </div>
            MeControla.AI
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src={Placeholder}
          alt="Login"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}