"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AccountSection() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">Sign out</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sign out on this device
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => signOut(() => router.push("/"))}
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </Button>
    </div>
  );
}
