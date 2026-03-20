import Link from "next/link"
import { Zap } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { SignInModalButton } from "@/components/sign-in-button"
import { ProfileButton } from "@/components/profile-button"
import { getUserPlan, isAdmin } from "@/lib/user"

export async function NewsletterHeader({ hideProfile }: { hideProfile?: boolean } = {}) {
  const { userId } = await auth()
  const plan = userId ? await getUserPlan(userId) : "free"
  const admin = isAdmin(plan)

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href={userId ? "/newsletters" : "/"} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Zap className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">The Latest</span>
          </Link>

          <nav className="flex items-center gap-6">
            {userId ? (
              <>
                <Link
                  href="/newsletters"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse
                </Link>
                <Link
                  href="/feed"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Feed
                </Link>
                {admin && (
                  <Link
                    href="/internal"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Internal
                  </Link>
                )}
                {!hideProfile && <ProfileButton />}
              </>
            ) : (
              <SignInModalButton />
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
