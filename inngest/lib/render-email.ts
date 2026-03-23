import { format, parseISO } from "date-fns";
import type { DigestContent } from "@/inngest/functions/newsletter-agent";
import type { Frequency } from "@/lib/frequency";

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMMM d, yyyy");
  } catch {
    return iso;
  }
}

function periodLabel(frequency: Frequency): string {
  const date = format(new Date(), "MMMM d, yyyy");
  const freq = frequency === "daily" ? "Daily" : "Weekly";
  return `${freq} · ${date}`;
}

type ItemSource = { url: string; name: string; publishedAt?: string };

/** Extract sources from a digest item, handling both old and new schema. */
function itemSources(item: Record<string, unknown>): ItemSource[] {
  if (Array.isArray(item.sources) && item.sources.length > 0)
    return item.sources as ItemSource[];
  if (typeof item.url === "string")
    return [
      {
        url: item.url,
        name: (item.source as string) ?? "Source",
        publishedAt: item.publishedAt as string | undefined,
      },
    ];
  return [];
}

/** Placeholder replaced per-recipient in email-sender. */
export const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";

type RenderOptions = {
  /** When true, render a teaser email with headlines only + upgrade CTA. */
  teaser?: boolean;
};

export function renderEmail(
  digest: DigestContent,
  newsletterTitle: string,
  frequency: Frequency,
  options: RenderOptions = {},
): string {
  const { teaser = false } = options;
  // In this edition (key takeaways)
  const takeawaysHtml = digest.keyTakeaways
    .map(
      (t) =>
        `<li style="margin-bottom:6px;font-size:13px;color:#333;line-height:1.55;">${t}</li>`,
    )
    .join("");

  // News sections
  const sectionsHtml = digest.sections
    .map(
      (section) => `
    <tr><td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 24px;background:#f5f5f5;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#888;margin:0;">${section.heading}</p>
        </td></tr>
        <tr><td style="padding:0 24px;">
          ${section.items
            .map(
              (item) => `
          <div style="padding:20px 0;border-bottom:1px solid #f0f0f0;">
            <p style="font-size:15px;font-weight:600;color:#111;margin:0 0 10px;line-height:1.35;">${item.title}</p>
            ${
              teaser
                ? ""
                : `<p style="font-size:13px;color:#555;line-height:1.65;margin:0 0 10px;">${item.detail}</p>
            ${item.quote ? `<blockquote style="margin:0 0 10px;padding:8px 14px;border-left:3px solid #ddd;color:#666;font-style:italic;font-size:13px;line-height:1.55;">"${item.quote}"</blockquote>` : ""}
            ${(() => {
              const sources = itemSources(item as unknown as Record<string, unknown>);
              if (sources.length === 0) return "";
              const primary = sources[0];
              const extra = sources.slice(1);
              return `<a href="${primary.url}" style="font-size:12px;font-weight:600;color:#555;text-decoration:none;border-bottom:1px solid #ddd;">Read more →</a>
            <span style="font-size:11px;color:#bbb;margin-left:8px;">${primary.publishedAt ? `${formatDate(primary.publishedAt)} · ` : ""}${primary.name}</span>${extra.map((s) => `<a href="${s.url}" style="font-size:11px;color:#bbb;margin-left:6px;text-decoration:none;border-bottom:1px solid #eee;">· ${s.name}</a>`).join("")}`;
            })()}`
            }
          </div>`,
            )
            .join("")}
        </td></tr>
      </table>
    </td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${digest.editionTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;padding:0 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e5e5e5;overflow:hidden;">

    <!-- Header -->
    <tr><td style="padding:32px 24px 24px;border-bottom:1px solid #f0f0f0;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#bbb;margin:0 0 8px;">${newsletterTitle}</p>
      <h1 style="font-size:24px;font-weight:700;color:#111;margin:0 0 10px;line-height:1.25;">${digest.editionTitle}</h1>
      <p style="font-size:12px;color:#bbb;margin:0 0 16px;">${periodLabel(frequency)}</p>
      <p style="font-size:14px;color:#555;line-height:1.65;margin:0;">${digest.summary}</p>
    </td></tr>

    <!-- In this edition (key takeaways) -->
    <tr><td style="padding:20px 24px;background:#fffbf0;border-bottom:1px solid #f0f0f0;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#aaa;margin:0 0 10px;">⚡ In this edition</p>
      <ul style="margin:0;padding-left:18px;">${takeawaysHtml}</ul>
    </td></tr>

    <!-- News items -->
    <tr><td style="padding:16px 24px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0">${sectionsHtml}</table>
    </td></tr>

    ${
      teaser
        ? `
    <!-- Upgrade CTA (free tier) -->
    <tr><td style="padding:32px 24px;background:#f7f7f7;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="font-size:14px;color:#555;line-height:1.65;margin:0 0 16px;">Want the full analysis, source links, and expert takes?</p>
      <a href="https://thelatest.io/pricing" style="display:inline-block;padding:12px 28px;background:#111;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">Upgrade to read more →</a>
    </td></tr>`
        : `
    <!-- Social consensus (Pro only) -->
    ${
      digest.socialConsensus
        ? `
    <tr><td style="padding:24px 24px;background:#f0f7ff;border-top:1px solid #e0eaf5;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7aa2d4;margin:0 0 8px;">💬 The discourse</p>
      <p style="font-size:14px;color:#444;line-height:1.65;margin:0 0 16px;">${digest.socialConsensus.overview}</p>
      ${digest.socialConsensus.highlights
        .map(
          (h) => `
      <div style="padding:12px 0;border-top:1px solid #e0eaf5;">
        <p style="font-size:13px;color:#333;line-height:1.55;margin:0 0 4px;">"${h.text}"</p>
        <p style="font-size:12px;color:#888;margin:0;">
          <a href="${h.url}" style="color:#7aa2d4;text-decoration:none;font-weight:600;">${h.authorName}</a>
          <span style="color:#aaa;"> ${h.author}</span>
          ${h.engagement ? `<span style="color:#aaa;"> · ${h.engagement}</span>` : ""}
        </p>
      </div>`,
        )
        .join("")}
    </td></tr>`
        : ""
    }

    <!-- Bottom line -->
    <tr><td style="padding:24px 24px;background:#f7f7f7;border-top:1px solid #f0f0f0;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#aaa;margin:0 0 10px;">The bottom line</p>
      <p style="font-size:14px;color:#444;line-height:1.65;margin:0;">${digest.bottomLine}</p>
    </td></tr>`
    }

    <!-- Footer -->
    <tr><td style="padding:20px 24px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="font-size:11px;color:#ccc;margin:0 0 8px;">You're receiving this because you subscribed to <strong>${newsletterTitle}</strong> on The Latest.</p>
      <a href="${UNSUBSCRIBE_PLACEHOLDER}" style="font-size:11px;color:#aaa;text-decoration:underline;">Unsubscribe</a>
    </td></tr>

  </table>
  </div>
</body>
</html>`;
}
