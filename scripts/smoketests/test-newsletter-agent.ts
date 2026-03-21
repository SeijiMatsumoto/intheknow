import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runNewsletterAgent } from "@/inngest/functions/newsletter-agent";
import { renderEmail } from "@/inngest/lib/render-email";

const newsletter = {
  title: "AI & LLMs Weekly",
  description:
    "A weekly digest of the latest AI agent frameworks, LLM releases, and practical tooling for engineers.",
  frequency: "weekly",
  keywords: [
    "AI agents",
    "LLMs",
    "OpenAI",
    "Anthropic",
    "RAG",
    "function calling",
  ],
  sources: {
    rss: [],
    sites: ["techcrunch.com", "theverge.com", "huggingface.co/blog"],
    twitter_queries: ["from:OpenAI OR #LLM"],
  },
};

async function main() {
  console.log("Running newsletter agent smoke test...");
  console.log(`Newsletter: ${newsletter.title}`);
  console.log(`Keywords:   ${newsletter.keywords.join(", ")}`);
  console.log("---\n");

  const result = await runNewsletterAgent(newsletter);

  console.log("=== AGENT SUMMARY ===");
  console.log(result.digest.agentSummary);

  console.log("\n=== METADATA ===");
  console.log(`Steps:      ${result.stepCount}`);
  console.log(`Tokens in:  ${result.usage.inputTokens}`);
  console.log(`Tokens out: ${result.usage.outputTokens}`);
  console.log(`Tool calls: ${JSON.stringify(result.toolCallCounts)}`);

  console.log("\n=== DIGEST ===");
  console.log(`Title:       ${result.digest.editionTitle}`);
  console.log(`Summary:     ${result.digest.summary}`);
  console.log(`Takeaways:   ${result.digest.keyTakeaways.length}`);
  for (const t of result.digest.keyTakeaways) {
    console.log(`  • ${t}`);
  }
  for (const section of result.digest.sections) {
    console.log(`\n  [${section.heading}]`);
    for (const item of section.items) {
      console.log(`    • ${item.title} — ${item.source} (${item.publishedAt})`);
      console.log(`      ${item.url}`);
    }
  }
  console.log(`\nBottom line: ${result.digest.bottomLine}`);

  const html = renderEmail(
    result.digest,
    newsletter.title,
    newsletter.frequency,
  );
  const outPath = resolve("scripts/smoketests/output/newsletter-agent.html");
  writeFileSync(outPath, html, "utf-8");
  console.log(`\nHTML written to: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
