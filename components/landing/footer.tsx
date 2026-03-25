export function LandingFooter() {
  return (
    <footer className="border-t border-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-serif text-sm font-bold text-foreground">
          ITK Dispatch
        </span>
        <p className="text-[11px] text-muted-foreground tracking-wide">
          &copy; {new Date().getFullYear()} ITK Dispatch. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
