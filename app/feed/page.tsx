import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewsletterHeader } from "@/components/newsletter-header";
import { getCategory } from "@/lib/categories";
import { getUserPlan, isAdmin } from "@/lib/user";
import { cn } from "@/lib/utils";
import { type DigestContent, getFeedSends } from "./data";

export default async function FeedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const plan = await getUserPlan(userId);
  const sends = await getFeedSends(userId, isAdmin(plan));

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            My Feed
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your digest history across all subscriptions.
          </p>
        </div>

        {sends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-medium text-foreground">
              Nothing here yet
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Subscribe to newsletters and your digests will show up here once they're sent.
            </p>
            <Link
              href="/newsletters"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              Browse newsletters
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sends.map((send) => {
              const { run } = send;
              const content = run.content as DigestContent | null;
              const cat = getCategory(run.newsletter.categoryId);
              const CatIcon = cat.icon;
              const sentDate = send.sentAt
                ? new Date(send.sentAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <Link
                  key={send.id}
                  href={`/feed/${run.id}`}
                  className="group block rounded-xl border border-border bg-card p-6 transition-all hover:border-muted-foreground/30 hover:bg-secondary/50"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        cat.bg,
                      )}
                    >
                      <CatIcon className={cn("h-5 w-5", cat.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">
                          {run.newsletter.title}
                        </span>
                        {sentDate && (
                          <span className="text-xs text-muted-foreground/60">
                            {sentDate}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-semibold text-foreground group-hover:text-accent transition-colors">
                        {content?.title ?? run.newsletter.title}
                      </p>

                      {content?.summary && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {content.summary}
                        </p>
                      )}

                      {content?.keyTakeaways &&
                        content.keyTakeaways.length > 0 && (
                          <p className="mt-3 text-xs text-muted-foreground/70">
                            {content.keyTakeaways.length} key takeaways ·{" "}
                            {content.sections?.length ?? 0} sections
                          </p>
                        )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
