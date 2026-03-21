import { auth } from "@clerk/nextjs/server";
import { BottomNav } from "@/components/bottom-nav";
import { NewsletterHeaderClient } from "@/components/newsletter-header-client";
import { getUserPlan, isAdmin } from "@/lib/user";

export async function NewsletterHeader({
  hideProfile,
}: {
  hideProfile?: boolean;
} = {}) {
  const { userId } = await auth();
  const plan = userId ? await getUserPlan(userId) : "free";
  const admin = isAdmin(plan);

  return (
    <>
      <NewsletterHeaderClient
        userId={userId ?? null}
        admin={admin}
        hideProfile={hideProfile}
      />
      {userId && <BottomNav />}
    </>
  );
}
