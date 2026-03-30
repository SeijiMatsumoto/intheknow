"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">Theme</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Switch between light and dark mode
        </p>
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        {theme === "dark" ? "Light" : "Dark"}
      </button>
    </div>
  );
}
