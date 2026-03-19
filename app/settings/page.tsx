import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen items-start justify-center px-6 py-12">
      <UserProfile routing="hash" />
    </div>
  );
}
