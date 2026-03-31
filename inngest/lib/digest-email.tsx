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
};

const font =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";

type ItemSource = { url: string; name: string; publishedAt?: string };

/** Format a publishedAt value as "Mar 25, 2026". Returns null if not parseable. */
function fmtPublishedAt(value: string): string | null {
  try {
    const date = parseISO(value);
    if (!Number.isNaN(date.getTime())) {
      return format(date, "MMM d, yyyy");
    }
  } catch {
    // not a valid ISO date
  }
  return null;
}

function getItemDate(sources: ItemSource[]): string | null {
  for (const s of sources) {
    if (s.publishedAt) {
      const formatted = fmtPublishedAt(s.publishedAt);
      if (formatted) return formatted;
    }
  }
  return null;
}

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

const sLabel: React.CSSProperties = {
  fontFamily: font,
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: C.mutedLight,
  margin: 0,
  textAlign: "center",
};

// ── Component ────────────────────────────────────────────────────────────────

type DigestEmailProps = {
  digest: DigestContent;
  newsletterTitle: string;
  teaser?: boolean;
};

export function DigestEmail({
  digest,
  newsletterTitle,
  teaser = false,
}: DigestEmailProps) {
  const dateLabel = format(new Date(), "EEEE, MMMM d, yyyy").toUpperCase();
  const title = digest.editionTitle;

  // Flatten all items as generic records for email rendering
  type EmailItem = Record<string, unknown> & { _section: string };
  const allItems: EmailItem[] = (digest.sections ?? []).flatMap((section) =>
    section.items.map(
      (item) =>
        ({
          ...item,
          _section: section.heading,
        }) as EmailItem,
    ),
  );

  return (
    <Html lang="en">
      <Head />
      <Preview>{digest.summary}</Preview>
      <Body
        style={{ margin: 0, padding: 0, background: C.bg, fontFamily: font }}
      >
        <Container
          style={{ maxWidth: "620px", margin: "32px auto", padding: "0 16px" }}
        >
          {/* ── Nameplate ─────────────────────────────────── */}
          <Hr
            style={{
              borderTop: `2px solid ${C.foreground}`,
              margin: "0 0 12px",
            }}
          />
          <Text
            style={{
              fontFamily: serif,
              fontSize: "28px",
              fontWeight: 700,
              color: C.foreground,
              textAlign: "center",
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            In The Know
          </Text>
          <Hr
            style={{ borderTop: `1px solid ${C.border}`, margin: "0 0 6px" }}
          />
          <Text style={{ ...sLabel, margin: "0 0 4px" }}>
            {newsletterTitle} · {dateLabel}
          </Text>
          <Hr
            style={{ borderTop: `1px solid ${C.border}`, margin: "6px 0 0" }}
          />

          {/* ── Headline ──────────────────────────────────── */}
          <Section style={{ padding: "24px 0", textAlign: "center" }}>
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
              {title}
            </Heading>
            <Text
              style={{
                fontFamily: font,
                fontSize: "14px",
                color: C.muted,
                lineHeight: "1.65",
                margin: 0,
              }}
            >
              {digest.summary}
            </Text>
          </Section>

          {/* ── In this edition ────────────────────────────── */}
          {digest.keyTakeaways?.length > 0 && (
            <>
              <Hr style={{ borderTop: `1px solid ${C.border}`, margin: 0 }} />
              <Section style={{ padding: "16px 0" }}>
                <Text style={{ ...sLabel, margin: "0 0 10px" }}>
                  In this edition
                </Text>
                {digest.keyTakeaways.map((t) => (
                  <Text
                    key={t}
                    style={{
                      fontFamily: font,
                      fontSize: "13px",
                      color: C.foreground,
                      lineHeight: "1.55",
                      margin: "0 0 4px",
                      paddingLeft: "12px",
                    }}
                  >
                    • {t}
                  </Text>
                ))}
              </Section>
              <Hr style={{ borderTop: `1px solid ${C.border}`, margin: 0 }} />
            </>
          )}

          {/* ── Stories ─────────────────────────────────── */}
          {allItems.map((item, idx) => {
            const sources = itemSources(item);
            const primary = sources[0];
            return (
              <Section
                key={primary?.url ?? idx}
                style={{
                  padding: "16px 0",
                  borderBottom: `1px solid ${C.borderLight}`,
                }}
              >
                {typeof item.category === "string" && (
                  <Text
                    style={{
                      fontFamily: font,
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.muted,
                      margin: "0 0 4px",
                    }}
                  >
                    {item.category}
                  </Text>
                )}
                <Text
                  style={{
                    fontFamily: serif,
                    fontSize: "16px",
                    fontWeight: 600,
                    color: C.foreground,
                    margin: "0 0 8px",
                    lineHeight: "1.35",
                  }}
                >
                  {item.title as string}
                </Text>
                {!teaser && (
                  <>
                    {item.detail && (
                      <Text
                        style={{
                          fontFamily: font,
                          fontSize: "13px",
                          color: C.muted,
                          lineHeight: "1.65",
                          margin: "0 0 8px",
                        }}
                      >
                        {item.detail as string}
                      </Text>
                    )}
                    {item.quote && (
                      <Text
                        style={{
                          margin: "0 0 8px",
                          padding: "6px 12px",
                          borderLeft: `2px solid ${C.border}`,
                          fontFamily: serif,
                          fontStyle: "italic",
                          fontSize: "13px",
                          color: C.muted,
                          lineHeight: "1.55",
                        }}
                      >
                        &ldquo;{item.quote as string}&rdquo;
                      </Text>
                    )}
                    {sources.length > 0 &&
                      (() => {
                        const date = getItemDate(sources);
                        return (
                          <Text
                            style={{
                              margin: 0,
                              fontSize: "11px",
                              color: C.mutedLight,
                            }}
                          >
                            {date && (
                              <span
                                style={{
                                  fontFamily: font,
                                  fontSize: "11px",
                                  color: C.mutedLight,
                                  marginRight: "6px",
                                }}
                              >
                                {date}
                                <span
                                  style={{
                                    margin: "0 6px",
                                    color: C.borderLight,
                                  }}
                                >
                                  |
                                </span>
                              </span>
                            )}
                            {sources.map((src, i) => (
                              <span key={src.url}>
                                {i > 0 && (
                                  <span style={{ margin: "0 4px" }}>·</span>
                                )}
                                <Link
                                  href={src.url}
                                  style={{
                                    color: C.mutedLight,
                                    textDecoration: "underline",
                                    textUnderlineOffset: "2px",
                                  }}
                                >
                                  {src.name}
                                </Link>
                              </span>
                            ))}
                          </Text>
                        );
                      })()}
                  </>
                )}
              </Section>
            );
          })}

          {teaser ? null : (
            <>
              {/* ── The Public Square ──────────────────────── */}
              {digest.socialConsensus && (
                <>
                  <Hr
                    style={{
                      borderTop: `1px solid ${C.border}`,
                      margin: "16px 0 0",
                    }}
                  />
                  <Section style={{ padding: "16px 0" }}>
                    <Text style={{ ...sLabel, margin: "0 0 12px" }}>
                      The Public Square
                    </Text>
                    <Text
                      style={{
                        fontFamily: font,
                        fontSize: "14px",
                        color: C.muted,
                        lineHeight: "1.65",
                        margin: "0 0 16px",
                      }}
                    >
                      {digest.socialConsensus.overview}
                    </Text>
                    {digest.socialConsensus.highlights.map((h) => (
                      <Section key={h.url} style={{ padding: "10px 0" }}>
                        <Text
                          style={{
                            fontFamily: serif,
                            fontSize: "13px",
                            fontStyle: "italic",
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
                          —{" "}
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
                </>
              )}

              {/* ── Editor's Note ──────────────────────────── */}
              {digest.bottomLine && (
                <Section
                  style={{
                    margin: "16px 0 0",
                    padding: "20px 24px",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <Text
                    style={{ ...sLabel, margin: "0 0 8px", textAlign: "left" }}
                  >
                    Editor&apos;s Note
                  </Text>
                  <Text
                    style={{
                      fontFamily: font,
                      fontSize: "14px",
                      color: C.muted,
                      lineHeight: "1.65",
                      margin: 0,
                    }}
                  >
                    {digest.bottomLine}
                  </Text>
                </Section>
              )}
            </>
          )}

          {/* ── Footer ────────────────────────────────────── */}
          <Hr
            style={{
              borderTop: `2px solid ${C.foreground}`,
              margin: "24px 0 12px",
            }}
          />
          <Text
            style={{
              fontFamily: serif,
              fontSize: "14px",
              fontWeight: 700,
              color: C.foreground,
              textAlign: "center",
              margin: "0 0 8px",
            }}
          >
            In The Know
          </Text>
          <Text
            style={{
              fontFamily: font,
              fontSize: "11px",
              color: C.mutedLight,
              textAlign: "center",
              margin: "0 0 4px",
            }}
          >
            You subscribed to{" "}
            <strong style={{ color: C.muted }}>{newsletterTitle}</strong> on In
            The Know.
          </Text>
          <Text style={{ textAlign: "center", margin: 0 }}>
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
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
