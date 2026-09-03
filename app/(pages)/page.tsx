import { LandingNavbar } from "../components/landing/navbar"
import { LandingHero } from "../components/landing/hero"
import { LandingFeatures } from "../components/landing/features"
import { LandingHowItWorks } from "../components/landing/how-it-works"
import { LandingTestimonials } from "../components/landing/testimonials"
import { LandingFAQ } from "../components/landing/faq"
import { LandingCTA } from "../components/landing/cta"
import { LandingFooter } from "../components/landing/footer"
import { auth } from "@/app/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    const firstWorkspaceId = session.user.workspaceIds?.[0]
    redirect(firstWorkspaceId ? `/${firstWorkspaceId}/dashboard` : "/dashboard")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Top Navbar */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingTestimonials />
        <LandingFAQ />
        <LandingCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
