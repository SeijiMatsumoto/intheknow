import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteNewsletter, updateNewsletter } from "@/app/actions/newsletters";
import { NewsletterForm } from "@/components/internal/newsletter-form";
import { NewsletterHeader } from "@/components/newsletters/newsletter-header";
import type { Frequency } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function EditNewsletterPage({ params }: Props) {
  const { id } = await params;
  const newsletter = await prisma.newsletter.findUnique({ where: { id } });
  if (!newsletter) notFound();

  const sources = newsletter.sources as {
    rss?: string[];
    bluesky_queries?: string[];
    sites?: string[];
  };

  const updateWithId = updateNewsletter.bind(null, id);
  const deleteWithId = deleteNewsletter.bind(null, id);

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <Link
            href="/internal"
            className="mb-4 block text-xs text-muted-foreground hover:underline"
          >
            ← Back to internal
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            Edit — {newsletter.title}
          </h1>
        </div>

        <NewsletterForm
          action={updateWithId}
          defaultValues={{
            title: newsletter.title,
            slug: newsletter.slug,
            description: newsletter.description ?? "",
            frequency: newsletter.frequency as Frequency,
            scheduleDays: newsletter.scheduleDays,
            scheduleHour: newsletter.scheduleHour,
            keywords: newsletter.keywords,
            sources,
          }}
        />

        <div className="mt-10 border-t pt-6">
          <p className="mb-3 text-xs text-muted-foreground">Danger zone</p>
          <form action={deleteWithId}>
            <button
              type="submit"
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Delete newsletter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
