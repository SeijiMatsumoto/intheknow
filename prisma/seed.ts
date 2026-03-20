import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../app/generated/prisma/client";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = [
  { id: "ai-tech",  label: "AI & Tech",  sortOrder: 0 },
  { id: "finance",  label: "Finance",    sortOrder: 1 },
  { id: "politics", label: "Politics",   sortOrder: 2 },
  { id: "gaming",   label: "Gaming",     sortOrder: 3 },
  { id: "sports",   label: "Sports",     sortOrder: 4 },
  { id: "science",  label: "Science",    sortOrder: 5 },
  { id: "business", label: "Business",   sortOrder: 6 },
];

const systemNewsletters = [
  // ── AI & Tech ──────────────────────────────────────────────────────
  {
    title: "AI Daily Brief",
    slug: "ai-daily-brief",
    description: "Everything that happened in AI today — model drops, product launches, industry moves, and the tools worth knowing about.",
    frequency: "daily",
    scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    scheduleHour: 8,
    categoryId: "ai-tech",
    keywords: ["AI news", "model release", "LLM", "OpenAI", "Anthropic", "Google DeepMind", "AI tools", "AI industry"],
    sources: {
      rss: ["https://openai.com/blog/rss", "https://www.anthropic.com/rss"],
      sites: ["https://techcrunch.com/category/artificial-intelligence/", "https://venturebeat.com/category/ai/"],
    },
  },
  {
    title: "Agentic AI",
    slug: "agentic-ai",
    description: "Agent frameworks, multi-agent systems, MCP, tool use, and orchestration patterns — the frontier of what LLMs can actually do.",
    frequency: "weekly",
    scheduleDays: ["tuesday"],
    scheduleHour: 8,
    categoryId: "ai-tech",
    keywords: ["AI agents", "multi-agent", "MCP", "tool use", "LangChain", "LlamaIndex", "CrewAI", "AutoGPT", "function calling", "orchestration"],
    sources: {
      rss: ["https://arxiv.org/rss/cs.MA"],
      sites: ["https://www.langchain.com/blog", "https://docs.llamaindex.ai/en/stable/"],
    },
  },
  {
    title: "AI Engineering",
    slug: "ai-engineering",
    description: "RAG, evals, prompt engineering, LLMOps, observability, and fine-tuning — the practical craft of building reliable AI systems.",
    frequency: "weekly",
    scheduleDays: ["wednesday"],
    scheduleHour: 8,
    categoryId: "ai-tech",
    keywords: ["RAG", "evals", "prompt engineering", "LLMOps", "fine-tuning", "LangSmith", "tracing", "observability", "embeddings", "vector database"],
    sources: {
      sites: ["https://hamel.dev", "https://parlance-labs.com", "https://applied-llms.org"],
    },
  },
  {
    title: "LLM Weekly",
    slug: "llm-weekly",
    description: "New model releases, benchmark results, API updates, and capability breakthroughs — everything you need to pick the right model.",
    frequency: "weekly",
    scheduleDays: ["monday"],
    scheduleHour: 8,
    categoryId: "ai-tech",
    keywords: ["LLM", "model release", "benchmark", "GPT", "Claude", "Gemini", "Llama", "Mistral", "SWE-bench", "API update"],
    sources: {
      rss: ["https://huggingface.co/blog/feed.xml"],
      sites: ["https://lmsys.org/blog/", "https://huggingface.co/blog"],
    },
  },

  // ── Finance ────────────────────────────────────────────────────────
  {
    title: "Markets Daily",
    slug: "markets-daily",
    description: "What moved markets today — equities, crypto, commodities, and the macro signals driving them.",
    frequency: "daily",
    scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    scheduleHour: 7,
    categoryId: "finance",
    keywords: ["stock market", "S&P 500", "crypto", "Bitcoin", "Fed", "interest rates", "earnings", "equities", "commodities"],
    sources: {
      rss: ["https://feeds.bloomberg.com/markets/news.rss"],
      sites: ["https://www.wsj.com/news/markets", "https://finance.yahoo.com"],
    },
  },
  {
    title: "The Economy",
    slug: "the-economy",
    description: "Macro trends, Fed policy, inflation, jobs, and the forces shaping the global economy.",
    frequency: "weekly",
    scheduleDays: ["thursday"],
    scheduleHour: 8,
    categoryId: "finance",
    keywords: ["macroeconomics", "inflation", "Federal Reserve", "GDP", "unemployment", "interest rates", "fiscal policy", "recession"],
    sources: {
      rss: ["https://www.economist.com/finance-and-economics/rss.xml"],
      sites: ["https://www.federalreserve.gov/feeds/press_all.xml"],
    },
  },

  // ── Politics ───────────────────────────────────────────────────────
  {
    title: "The Briefing",
    slug: "the-briefing",
    description: "The day's most important political stories — US politics, policy, legislation, and global affairs.",
    frequency: "daily",
    scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    scheduleHour: 7,
    categoryId: "politics",
    keywords: ["US politics", "Congress", "White House", "legislation", "election", "policy", "geopolitics", "foreign policy"],
    sources: {
      rss: ["https://feeds.npr.org/1001/rss.xml"],
      sites: ["https://www.politico.com", "https://thehill.com"],
    },
  },

  // ── Gaming ─────────────────────────────────────────────────────────
  {
    title: "Level Up",
    slug: "level-up",
    description: "Game releases, industry news, developer updates, and what's actually worth playing this week.",
    frequency: "weekly",
    scheduleDays: ["friday"],
    scheduleHour: 9,
    categoryId: "gaming",
    keywords: ["video games", "game release", "Nintendo", "PlayStation", "Xbox", "Steam", "esports", "indie games", "game dev"],
    sources: {
      rss: ["https://www.ign.com/articles.rss"],
      sites: ["https://www.eurogamer.net", "https://kotaku.com"],
    },
  },

  // ── Sports ─────────────────────────────────────────────────────────
  {
    title: "The Scoreboard",
    slug: "the-scoreboard",
    description: "Scores, standings, trades, and the biggest stories across the major sports leagues.",
    frequency: "daily",
    scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    scheduleHour: 7,
    categoryId: "sports",
    keywords: ["NFL", "NBA", "MLB", "NHL", "soccer", "Premier League", "trade", "standings", "playoffs"],
    sources: {
      rss: ["https://www.espn.com/espn/rss/news"],
      sites: ["https://www.espn.com", "https://theathletic.com"],
    },
  },

  // ── Science ────────────────────────────────────────────────────────
  {
    title: "Science Weekly",
    slug: "science-weekly",
    description: "Breakthroughs in physics, biology, space, and climate — the discoveries that are changing how we understand the world.",
    frequency: "weekly",
    scheduleDays: ["wednesday"],
    scheduleHour: 8,
    categoryId: "science",
    keywords: ["science", "physics", "biology", "space", "NASA", "climate", "research", "discovery", "medicine"],
    sources: {
      rss: ["https://www.science.org/rss/news_current.xml", "https://www.nasa.gov/rss/dyn/breaking_news.rss"],
      sites: ["https://www.sciencedaily.com", "https://www.quantamagazine.org"],
    },
  },

  // ── Business ───────────────────────────────────────────────────────
  {
    title: "Business Brief",
    slug: "business-brief",
    description: "M&A, earnings, strategy moves, and the companies and leaders shaping the global business landscape.",
    frequency: "weekly",
    scheduleDays: ["tuesday"],
    scheduleHour: 8,
    categoryId: "business",
    keywords: ["M&A", "earnings", "IPO", "Fortune 500", "CEO", "strategy", "corporate", "venture capital", "startup funding"],
    sources: {
      rss: ["https://feeds.fortune.com/fortune/feeds/site_headlines"],
      sites: ["https://www.businessinsider.com", "https://hbr.org"],
    },
  },
];

async function main() {
  console.log("Seeding categories...");
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { label: cat.label, sortOrder: cat.sortOrder },
      create: cat,
    });
    console.log(`  ✓ ${cat.label}`);
  }

  console.log("Seeding system newsletters...");

  // Remove old newsletters that are no longer relevant (cascade delete subscriptions/runs first)
  const slugsToRemove = ["ai-safety-digest", "startup-founder-digest", "ai-research-papers", "ai-in-products", "ai-infrastructure", "open-source-ai"];
  for (const slug of slugsToRemove) {
    const nl = await prisma.newsletter.findUnique({ where: { slug } });
    if (!nl) continue;
    await prisma.subscription.deleteMany({ where: { newsletterId: nl.id } });
    const runs = await prisma.digestRun.findMany({ where: { newsletterId: nl.id }, select: { id: true } });
    await prisma.digestSend.deleteMany({ where: { runId: { in: runs.map(r => r.id) } } });
    await prisma.digestRun.deleteMany({ where: { newsletterId: nl.id } });
    await prisma.newsletter.delete({ where: { id: nl.id } });
    console.log(`  ✗ removed ${slug}`);
  }

  for (const newsletter of systemNewsletters) {
    await prisma.newsletter.upsert({
      where: { slug: newsletter.slug },
      update: {
        title: newsletter.title,
        description: newsletter.description,
        frequency: newsletter.frequency,
        scheduleDays: newsletter.scheduleDays,
        scheduleHour: newsletter.scheduleHour,
        categoryId: newsletter.categoryId,
        keywords: newsletter.keywords,
        sources: newsletter.sources,
      },
      create: {
        ...newsletter,
        createdBy: null,
      },
    });
    console.log(`  ✓ ${newsletter.title}`);
  }

  console.log(`Done. ${systemNewsletters.length} newsletters seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
