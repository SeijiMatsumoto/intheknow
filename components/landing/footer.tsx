export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-serif text-sm font-bold text-foreground">
          In The Know
        </span>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} In The Know. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
