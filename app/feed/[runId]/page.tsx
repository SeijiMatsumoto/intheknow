import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { getUserPlan, isAdmin } from "@/lib/user";
import { cn } from "@/lib/utils";
import { type DigestContent, getFeedDigest } from "../data";

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/");

  const plan = await getUserPlan(userId);
  const send = await getFeedDigest(runId, userId, isAdmin(plan));

  if (!send) notFound();

  const content = send.run.content as DigestContent | null;
  if (!content) notFound();

  const cat = getCategory(send.run.newsletter.categoryId);
  const CatIcon = cat.icon;
  const sentDate = send.sentAt
    ? new Date(send.sentAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-6">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            My Feed
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Meta */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                cat.bg,
              )}
            >
              <CatIcon className={cn("h-3.5 w-3.5", cat.color)} />
            </div>
            <Link
              href={`/newsletters/${send.run.newsletter.slug}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {send.run.newsletter.title}
            </Link>
            {sentDate && (
              <span className="text-sm text-muted-foreground/60">
                · {sentDate}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            {content.title}
          </h1>

          {content.summary && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed text-pretty">
              {content.summary}
            </p>
          )}
        </div>

        {/* Key Takeaways */}
        {content.keyTakeaways?.length > 0 && (
          <section className="mb-10 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              Key takeaways
            </h2>
            <ul className="space-y-3">
              {content.keyTakeaways.map((takeaway) => (
                <li key={takeaway} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {takeaway}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sections */}
        <div className="space-y-10">
          {content.sections?.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.url}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                            {item.source}
                          </span>
                        </div>
                        <h3 className="font-medium text-foreground leading-snug">
                          {item.title}
                        </h3>
                        {item.summary && (
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {item.summary}
                          </p>
                        )}
                        {item.quote && (
                          <blockquote className="mt-3 border-l-2 border-accent/50 pl-3 text-sm italic text-muted-foreground">
                            "{item.quote}"
                          </blockquote>
                        )}
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
