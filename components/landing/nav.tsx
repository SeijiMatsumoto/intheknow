import { ThemeToggle } from "@/components/common/theme-toggle";
import { SignInModalButton } from "@/components/layout/sign-in-button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex items-center justify-between h-16">
          <span className="font-serif text-xl font-bold tracking-tight text-foreground">
            In The Know
          </span>
          <nav className="hidden sm:flex items-center gap-8 text-sm text-muted-foreground absolute left-1/2 -translate-x-1/2">
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignInModalButton />
          </div>
        </div>
      </div>
      <div className="border-b border-border" />
    </header>
  );
}
