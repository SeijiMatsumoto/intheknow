import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Config ───────────────────────────────────────────────────────────────────

const QUERIES = [
  "AI model announcements",
  "tech industry layoffs",
  "OpenAI GPT releases",
];

const BLOCKED_DOMAINS = new Set([
  "medium.com",
  "hubspot.com",
  "about.com",
  "ehow.com",
  "wikihow.com",
  "quora.com",
  "pinterest.com",
  "slideshare.net",
  "scribd.com",
  "issuu.com",
  "makeuseof.com",
  "x.com",
  "buzzfeed.com",
  "screenrant.com",
  "cbr.com",
  "gamerant.com",
  "boredpanda.com",
  "dailydot.com",
  "devflokers.com",
  "tldl.io",
  "getaibook.com",
  "pricepertoken.com",
  "llm-stats.com",
  "promptinjection.net",
  "rtinsights.com",
  "substack.com",
  "beehiiv.com",
  "ghost.io",
  "hashnode.dev",
  "dev.to",
  "interconnects.ai",
  "theneurondaily.com",
  "morningbrew.com",
  "techbuzz.ai",
  "tldr.tech",
  "bensbites.com",
  "therundown.ai",
  "superhuman.ai",
  "aibreakfast.com",
  "whytryai.com",
  "msn.com",
  "news.yahoo.com",
  "news.google.com",
  "flipboard.com",
  "smartnews.com",
  "newsbreak.com",
  "ground.news",
  "cheapism.com",
  "nerdwallet.com",
  "moneywise.com",
  "investopedia.com",
  "fool.com",
  "bankrate.com",
  "reddit.com",
  "stackoverflow.com",
  "stackexchange.com",
  "prnewswire.com",
  "businesswire.com",
  "globenewswire.com",
  "accesswire.com",
  "prweb.com",
]);

const BLOCKED_DOMAIN_SUFFIXES = [
  "substack.com",
  "beehiiv.com",
  "ghost.io",
  "hashnode.dev",
  "medium.com",
  "msn.com",
  "yahoo.com",
  "blogspot.com",
  "wordpress.com",
  "tumblr.com",
];

const BLOG_PATH_PATTERNS = [
  /\/(blog|blogs|newsletter|newsletters|digest|roundup|recap|weekly|daily)\b/i,
  /news-roundup|news-recap|weekly-update|daily-update/i,
  /top-\d+-|best-of-|\d+-things-/i,
  /\/(sponsored|partner|branded-content|advertorial)\b/i,
];

const ADVICE_PATH_PATTERNS = [
  /\/(learn|guide|guides|how-to|tutorial|tutorials|tips|advice|personal-finance)\b/i,
  /\/(listicle|list|lists|compare|vs|versus|review|reviews)\b/i,
  /\/(explained|explainer|what-is|definition|glossary|faq)\b/i,
];

type RawResult = {
  title: string;
  url: string;
  snippet: string;
  date?: string;
};

// ── Filtering (mirrors search-web.ts logic) ──────────────────────────────────

function isViableUrl(r: RawResult, seenUrls: Set<string>): boolean {
  if (!r.snippet?.trim() || r.snippet.trim().length < 80) return false;
  if (seenUrls.has(r.url)) return false;

  let url: URL;
  try {
    url = new URL(r.url);
  } catch {
    return false;
  }

  const hostname = url.hostname.replace(/^www\./, "");
  if (BLOCKED_DOMAINS.has(hostname)) return false;
  if (BLOCKED_DOMAIN_SUFFIXES.some((suffix) => hostname.endsWith(`.${suffix}`)))
    return false;
  if (url.pathname === "/" || url.pathname === "") return false;
  if (
    /^\/(tag|tags|category|categories|author|authors|topic|topics|archive|search)\b/i.test(
      url.pathname,
    )
  )
    return false;
  if (BLOG_PATH_PATTERNS.some((p) => p.test(url.pathname))) return false;
  if (ADVICE_PATH_PATTERNS.some((p) => p.test(url.pathname))) return false;

  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const DIVIDER = "─".repeat(72);

async function searchSerper(query: string): Promise<RawResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY not set");

  const res = await fetch("https://google.serper.dev/news", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: 10,
      tbs: "qdr:w",
      gl: "us",
      hl: "en",
    }),
  });

  if (!res.ok) {
    throw new Error(`Serper API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    news?: { title: string; link: string; snippet: string; date?: string }[];
  };

  return (data.news ?? []).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
    date: r.date,
  }));
}

async function main() {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error("SERPER_API_KEY is not set. Exiting.");
    process.exit(1);
  }

  console.log(`\n  Serper API Smoke Test`);
  console.log(`  ${new Date().toISOString()}`);
  console.log(DIVIDER);

  const seenUrls = new Set<string>();
  const allResults: Record<string, { raw: RawResult[]; viable: RawResult[] }> =
    {};

  for (const query of QUERIES) {
    console.log(`\n  Query: "${query}"`);
    console.log(DIVIDER);

    try {
      const raw = await searchSerper(query);
      const viable = raw.filter((r) => isViableUrl(r, seenUrls));

      for (const r of viable) {
        seenUrls.add(r.url);
      }

      allResults[query] = { raw, viable };

      console.log(`  Raw results:    ${raw.length}`);
      console.log(`  After filters:  ${viable.length}`);
      console.log(`  Filtered out:   ${raw.length - viable.length}`);
      console.log();

      for (const [i, r] of viable.entries()) {
        console.log(`  ${i + 1}. ${r.title}`);
        console.log(`     ${r.url}`);
        console.log(`     ${r.date ?? "no date"}`);
        console.log(
          `     ${r.snippet.length > 120 ? r.snippet.slice(0, 120) + "…" : r.snippet}`,
        );
        console.log();
      }

      // Show what was filtered
      const filtered = raw.filter((r) => !isViableUrl(r, new Set()));
      if (filtered.length > 0) {
        console.log(`  Filtered out:`);
        for (const r of filtered) {
          let reason = "unknown";
          try {
            const url = new URL(r.url);
            const hostname = url.hostname.replace(/^www\./, "");
            if (BLOCKED_DOMAINS.has(hostname))
              reason = `blocked domain: ${hostname}`;
            else if (
              BLOCKED_DOMAIN_SUFFIXES.some((s) => hostname.endsWith(`.${s}`))
            )
              reason = `blocked subdomain: ${hostname}`;
            else if (url.pathname === "/" || url.pathname === "")
              reason = "bare homepage";
            else if (BLOG_PATH_PATTERNS.some((p) => p.test(url.pathname)))
              reason = "blog path pattern";
            else if (ADVICE_PATH_PATTERNS.some((p) => p.test(url.pathname)))
              reason = "advice/guide path";
            else if (!r.snippet?.trim() || r.snippet.trim().length < 80)
              reason = "snippet too short";
          } catch {
            reason = "invalid URL";
          }
          console.log(`    ✗ ${r.title}`);
          console.log(`      ${r.url} (${reason})`);
        }
        console.log();
      }
    } catch (err) {
      console.error(
        `  ERROR: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Write output
  const outDir = resolve("scripts/smoketests/output");
  mkdirSync(outDir, { recursive: true });

  const jsonPath = resolve(outDir, "serper-results.json");
  writeFileSync(jsonPath, JSON.stringify(allResults, null, 2), "utf-8");

  console.log(DIVIDER);
  console.log(`  Total unique URLs: ${seenUrls.size}`);
  console.log(`  Output: ${jsonPath}`);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
