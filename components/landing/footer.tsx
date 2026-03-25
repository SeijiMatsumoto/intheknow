export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="font-serif text-sm font-bold text-foreground">
          ITK Dispatch
        </span>
        <p>&copy; {new Date().getFullYear()} ITK Dispatch. All rights reserved.</p>
      </div>
    </footer>
  );
}
