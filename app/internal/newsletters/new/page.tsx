import Link from "next/link";
import { createNewsletter } from "@/app/actions/newsletters";
import { NewsletterForm } from "@/components/internal/newsletter-form";
import { NewsletterHeader } from "@/components/newsletter-header";

export default function NewNewsletterPage() {
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
            New newsletter
          </h1>
        </div>
        <NewsletterForm action={createNewsletter} />
      </div>
    </div>
  );
}
