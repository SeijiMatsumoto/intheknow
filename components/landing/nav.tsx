import { SignInModalButton } from "@/components/sign-in-button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex items-center justify-between py-3">
          <span className="font-serif text-xl font-bold tracking-tight text-foreground">
            ITK Dispatch
          </span>
          <nav className="hidden sm:flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground absolute left-1/2 -translate-x-1/2">
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
      <div className="border-b border-foreground" />
    </header>
  );
}
