import { Zap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent">
            <Zap className="h-3 w-3 text-accent-foreground" />
          </div>
          <span className="font-medium text-foreground">The Latest</span>
        </div>
        <p>&copy; {new Date().getFullYear()} The Latest. All rights reserved.</p>
      </div>
    </footer>
  );
}
