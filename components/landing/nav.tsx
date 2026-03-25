import { SignInModalButton } from "@/components/sign-in-button";

export function LandingNav() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="font-serif text-xl font-bold tracking-tight text-foreground">
            ITK Dispatch
          </span>
          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
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
          <SignInModalButton />
        </div>
      </div>
    </header>
  );
}
