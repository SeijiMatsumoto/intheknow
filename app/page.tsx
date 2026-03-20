import { SignInModalButton } from "@/components/sign-in-button"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"
import { Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function Home() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Zap className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">The Latest</span>
            </div>
            <nav className="flex items-center gap-4">
              {userId ? (
                <Button size="sm">
                  <Link href="/newsletters" className="flex items-center gap-1.5">
                    Browse newsletters
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : (
                <SignInModalButton />
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6">
        <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center text-center">
          <div className="mb-6 flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent">
            <Zap className="h-3.5 w-3.5" />
            AI-powered newsletter digests
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
            Stay ahead of{" "}
            <span className="text-accent">what matters</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            Curated AI-powered digests on the topics you care about, delivered on your schedule.
            Subscribe once, stay informed always.
          </p>

          <div className="mt-10 flex items-center gap-4">
            {userId ? (
              <Button size="lg">
                <Link href="/newsletters" className="flex items-center gap-2">
                  Browse newsletters
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <SignInModalButton />
                <Link
                  href="/newsletters"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse first
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
