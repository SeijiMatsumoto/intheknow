import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { format, parseISO } from "date-fns";
import type { DigestContent } from "@/inngest/functions/newsletter-agent";
import type { Frequency } from "@/lib/frequency";

export const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";

// ── Color palette (matches app warm cream theme) ─────────────────────────────
const C = {
  bg: "#f3efe8",
  card: "#faf8f4",
  foreground: "#1a1812",
  muted: "#8a8478",
  mutedLight: "#b5afa5",
  border: "#d9d3c7",
  borderLight: "#e8e3da",
  accent: "#f7f3ec",
  socialBg: "#f5f2ec",
};

const font =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";

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

// ── Shared styles ────────────────────────────────────────────────────────────

const s = {
  label: {
    fontFamily: font,
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: C.mutedLight,
    margin: "0 0 10px",
  },
  body: {
    fontFamily: font,
    fontSize: "14px",
    color: C.muted,
    lineHeight: "1.65",
    margin: "0" as const,
  },
  serifTitle: {
    fontFamily: serif,
    fontSize: "16px",
    fontWeight: 600,
    color: C.foreground,
    margin: "0 0 8px",
    lineHeight: "1.35",
  },
  detail: {
    fontFamily: font,
    fontSize: "13px",
    color: C.muted,
    lineHeight: "1.65",
    margin: "0 0 10px",
  },
  sourceLink: {
    fontFamily: font,
    fontSize: "12px",
    fontWeight: 600,
    color: C.muted,
    textDecoration: "none" as const,
    borderBottom: `1px solid ${C.border}`,
  },
  sourceMeta: {
    fontSize: "11px",
    color: C.mutedLight,
    marginLeft: "8px",
  },
};

// ── Component ────────────────────────────────────────────────────────────────

type DigestEmailProps = {
  digest: DigestContent;
  newsletterTitle: string;
  frequency: Frequency;
  teaser?: boolean;
};

export function DigestEmail({
  digest,
  newsletterTitle,
  frequency,
  teaser = false,
}: DigestEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{digest.editionTitle}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          background: C.bg,
          fontFamily: font,
        }}
      >
        <Container
          style={{
            maxWidth: "620px",
            margin: "32px auto",
            padding: "0 16px",
          }}
        >
          {/* Card wrapper */}
          <Section
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            {/* Masthead */}
            <Section
              style={{
                padding: "28px 32px 12px",
                textAlign: "center" as const,
                borderBottom: `1px solid ${C.borderLight}`,
              }}
            >
              <Text
                style={{
                  fontFamily: serif,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: C.foreground,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                ITK Dispatch
              </Text>
            </Section>

            {/* Header */}
            <Section style={{ padding: "28px 32px 24px" }}>
              <Text style={{ ...s.label, margin: "0 0 12px" }}>
                {newsletterTitle} · {periodLabel(frequency)}
              </Text>
              <Heading
                as="h1"
                style={{
                  fontFamily: serif,
                  fontSize: "26px",
                  fontWeight: 700,
                  color: C.foreground,
                  margin: "0 0 12px",
                  lineHeight: "1.2",
                }}
              >
                {digest.editionTitle}
              </Heading>
              <Text style={s.body}>{digest.summary}</Text>
            </Section>

            {/* In this edition */}
            {digest.keyTakeaways?.length > 0 && (
              <Section
                style={{
                  padding: "20px 32px",
                  background: C.accent,
                  borderTop: `1px solid ${C.borderLight}`,
                  borderBottom: `1px solid ${C.borderLight}`,
                }}
              >
                <Text style={s.label}>In this edition</Text>
                {digest.keyTakeaways.map((t) => (
                  <Text
                    key={t}
                    style={{
                      fontFamily: font,
                      fontSize: "13px",
                      color: C.foreground,
                      lineHeight: "1.6",
                      margin: "0 0 4px",
                      paddingLeft: "12px",
                    }}
                  >
                    • {t}
                  </Text>
                ))}
              </Section>
            )}

            {/* Sections */}
            {digest.sections?.map((section) => (
              <Section key={section.heading}>
                {/* Section heading */}
                <Section
                  style={{
                    padding: "8px 32px",
                    background: C.accent,
                    borderTop: `1px solid ${C.border}`,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <Text style={{ ...s.label, margin: 0 }}>
                    {section.heading}
                  </Text>
                </Section>

                {/* Items */}
                <Section style={{ padding: "0 32px" }}>
                  {section.items.map((item, idx) => {
                    const sources = itemSources(
                      item as unknown as Record<string, unknown>,
                    );
                    const primary = sources[0];
                    const extra = sources.slice(1);

                    return (
                      <Section
                        key={primary?.url ?? idx}
                        style={{
                          padding: "20px 0",
                          borderBottom: `1px solid ${C.borderLight}`,
                        }}
                      >
                        <Text style={s.serifTitle}>{item.title}</Text>

                        {!teaser && (
                          <>
                            {item.detail && (
                              <Text style={s.detail}>{item.detail}</Text>
                            )}

                            {item.quote && (
                              <Text
                                style={{
                                  margin: "0 0 10px",
                                  padding: "8px 14px",
                                  borderLeft: `2px solid ${C.border}`,
                                  color: C.muted,
                                  fontStyle: "italic",
                                  fontFamily: serif,
                                  fontSize: "13px",
                                  lineHeight: "1.55",
                                }}
                              >
                                &ldquo;{item.quote}&rdquo;
                              </Text>
                            )}

                            {primary && (
                              <Text style={{ margin: 0 }}>
                                <Link
                                  href={primary.url}
                                  style={s.sourceLink}
                                >
                                  Read more →
                                </Link>
                                <span style={s.sourceMeta}>
                                  {primary.publishedAt
                                    ? `${formatDate(primary.publishedAt)} · `
                                    : ""}
                                  {primary.name}
                                </span>
                                {extra.map((ex) => (
                                  <Link
                                    key={ex.url}
                                    href={ex.url}
                                    style={{
                                      fontSize: "11px",
                                      color: C.mutedLight,
                                      marginLeft: "6px",
                                      textDecoration: "none",
                                      borderBottom: `1px solid ${C.borderLight}`,
                                    }}
                                  >
                                    · {ex.name}
                                  </Link>
                                ))}
                              </Text>
                            )}
                          </>
                        )}
                      </Section>
                    );
                  })}
                </Section>
              </Section>
            ))}

            {teaser ? (
              /* Upgrade CTA for free tier */
              <Section
                style={{
                  padding: "32px",
                  background: C.accent,
                  borderTop: `1px solid ${C.border}`,
                  textAlign: "center" as const,
                }}
              >
                <Text style={{ ...s.body, margin: "0 0 16px" }}>
                  Want the full analysis, source links, and expert takes?
                </Text>
                <Link
                  href="https://thelatest.io/pricing"
                  style={{
                    display: "inline-block",
                    padding: "12px 28px",
                    background: C.foreground,
                    color: C.card,
                    fontFamily: font,
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Upgrade to read more →
                </Link>
              </Section>
            ) : (
              <>
                {/* Social consensus */}
                {digest.socialConsensus && (
                  <Section
                    style={{
                      padding: "24px 32px",
                      background: C.socialBg,
                      borderTop: `1px solid ${C.border}`,
                    }}
                  >
                    <Text style={s.label}>The discourse</Text>
                    <Text style={{ ...s.body, margin: "0 0 16px" }}>
                      {digest.socialConsensus.overview}
                    </Text>
                    {digest.socialConsensus.highlights.map((h) => (
                      <Section
                        key={h.url}
                        style={{
                          padding: "12px 0",
                          borderTop: `1px solid ${C.border}`,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: serif,
                            fontSize: "13px",
                            color: C.foreground,
                            lineHeight: "1.55",
                            margin: "0 0 4px",
                          }}
                        >
                          &ldquo;{h.text}&rdquo;
                        </Text>
                        <Text
                          style={{
                            fontFamily: font,
                            fontSize: "11px",
                            color: C.mutedLight,
                            margin: 0,
                          }}
                        >
                          <Link
                            href={h.url}
                            style={{
                              color: C.foreground,
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            {h.authorName}
                          </Link>{" "}
                          {h.author}
                          {h.engagement ? ` · ${h.engagement}` : ""}
                        </Text>
                      </Section>
                    ))}
                  </Section>
                )}

                {/* Bottom line */}
                {digest.bottomLine && (
                  <Section
                    style={{
                      padding: "24px 32px",
                      background: C.accent,
                      borderTop: `1px solid ${C.border}`,
                    }}
                  >
                    <Text style={s.label}>The bottom line</Text>
                    <Text style={s.body}>{digest.bottomLine}</Text>
                  </Section>
                )}
              </>
            )}

            {/* Footer */}
            <Section
              style={{
                padding: "24px 32px",
                borderTop: `1px solid ${C.border}`,
                textAlign: "center" as const,
              }}
            >
              <Text
                style={{
                  fontFamily: font,
                  fontSize: "11px",
                  color: C.mutedLight,
                  margin: "0 0 8px",
                }}
              >
                You're receiving this because you subscribed to{" "}
                <strong style={{ color: C.muted }}>{newsletterTitle}</strong> on
                ITK Dispatch.
              </Text>
              <Link
                href={UNSUBSCRIBE_PLACEHOLDER}
                style={{
                  fontFamily: font,
                  fontSize: "11px",
                  color: C.mutedLight,
                  textDecoration: "underline",
                }}
              >
                Unsubscribe
              </Link>
            </Section>
          </Section>

          {/* Brand footer */}
          <Text
            style={{
              fontFamily: serif,
              fontSize: "12px",
              color: C.mutedLight,
              textAlign: "center" as const,
              margin: "20px 0 0",
              letterSpacing: "-0.01em",
            }}
          >
            ITK Dispatch
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
