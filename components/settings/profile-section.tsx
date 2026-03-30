"use client";

import { useUser } from "@clerk/nextjs";
import { Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProfileSection() {
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (
    isLoaded &&
    user &&
    firstName === "" &&
    lastName === "" &&
    (user.firstName || user.lastName)
  ) {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }

  const initials =
    [user?.firstName, user?.lastName]
      .filter((n): n is string => Boolean(n))
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
    "?";

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await user.update({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="flex items-center gap-4">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={initials}
            width={56}
            height={56}
            referrerPolicy="no-referrer"
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-lg font-semibold text-accent">
            {initials}
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">{user?.fullName || "—"}</p>
          <p className="text-sm text-muted-foreground">
            {user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="firstName"
            className="text-sm font-medium text-foreground"
          >
            First name
          </label>
          <input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="lastName"
            className="text-sm font-medium text-foreground"
          >
            Last name
          </label>
          <input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          value={user?.emailAddresses[0]?.emailAddress ?? ""}
          disabled
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed here.
        </p>
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm">
        <Save className="h-3.5 w-3.5" />
        {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
      </Button>
    </>
  );
}
