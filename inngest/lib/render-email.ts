import { render } from "@react-email/components";
import type { DigestContent } from "@/inngest/functions/newsletter-agent";
import { DigestEmail, UNSUBSCRIBE_PLACEHOLDER } from "./digest-email";

export { UNSUBSCRIBE_PLACEHOLDER };

type RenderOptions = {
  /** When true, render a teaser email with headlines only + upgrade CTA. */
  teaser?: boolean;
};

export async function renderEmail(
  digest: DigestContent,
  newsletterTitle: string,
  options: RenderOptions = {},
): Promise<string> {
  return render(
    DigestEmail({
      digest,
      newsletterTitle,
      teaser: options.teaser,
    }),
  );
}
