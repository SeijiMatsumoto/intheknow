import type { DigestContent } from "./synthesize";

export function renderEmail(digest: DigestContent, newsletterTitle: string): string {
  const sectionsHtml = digest.sections
    .map(
      (section) => `
    <h2 style="font-size:15px;font-weight:600;color:#111;margin:32px 0 12px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">${section.heading}</h2>
    ${section.items
      .map(
        (item) => `
      <div style="margin-bottom:20px;">
        <a href="${item.url}" style="font-size:14px;font-weight:600;color:#111;text-decoration:none;line-height:1.4;">${item.title}</a>
        <p style="font-size:12px;color:#999;margin:3px 0 6px;">${item.source}</p>
        <p style="font-size:13px;color:#444;line-height:1.6;margin:0;">${item.summary}</p>
        ${item.quote ? `<blockquote style="margin:8px 0 0;padding:6px 12px;border-left:3px solid #e0e0e0;color:#666;font-style:italic;font-size:13px;">"${item.quote}"</blockquote>` : ""}
      </div>`
      )
      .join("")}`
    )
    .join("");

  const takeawaysHtml = digest.keyTakeaways
    .map((t) => `<li style="margin-bottom:5px;font-size:13px;color:#444;line-height:1.5;">${t}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:8px;border:1px solid #e5e5e5;overflow:hidden;">

    <div style="padding:28px 36px 24px;border-bottom:1px solid #f0f0f0;">
      <p style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#aaa;margin:0 0 6px;">${newsletterTitle}</p>
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px;line-height:1.3;">${digest.title}</h1>
      <p style="font-size:13px;color:#555;line-height:1.65;margin:0;">${digest.summary}</p>
    </div>

    <div style="padding:20px 36px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
      <p style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#aaa;margin:0 0 8px;">Key Takeaways</p>
      <ul style="margin:0;padding-left:18px;">${takeawaysHtml}</ul>
    </div>

    <div style="padding:4px 36px 28px;">${sectionsHtml}</div>

    <div style="padding:20px 36px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="font-size:11px;color:#ccc;margin:0;">You're receiving this because you subscribed to ${newsletterTitle} on The Latest.</p>
    </div>
  </div>
</body>
</html>`;
}
