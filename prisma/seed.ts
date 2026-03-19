import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../app/generated/prisma/client";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const systemNewsletters = [
  {
    title: "LLM Weekly",
    slug: "llm-weekly",
    description:
      "The most important developments in large language models — new releases, benchmarks, research, and real-world deployments.",
    frequency: "weekly",
    keywords: ["LLM", "language model", "GPT", "Claude", "Gemini", "Llama", "fine-tuning", "RLHF"],
    sources: {
      rss: ["https://arxiv.org/rss/cs.CL", "https://feeds.feedburner.com/oreilly/radar"],
      twitter_queries: ["LLM release", "language model benchmark", "GPT Claude Gemini"],
      sites: ["https://huggingface.co/blog", "https://openai.com/blog"],
    },
  },
  {
    title: "AI Safety Digest",
    slug: "ai-safety-digest",
    description:
      "Alignment research, interpretability breakthroughs, governance updates, and the people working to make AI go well.",
    frequency: "weekly",
    keywords: ["AI safety", "alignment", "interpretability", "AI governance", "existential risk", "RLHF", "red teaming"],
    sources: {
      rss: ["https://www.alignmentforum.org/feed.xml"],
      twitter_queries: ["AI alignment research", "AI safety interpretability"],
      sites: ["https://www.anthropic.com/research", "https://deepmind.google/research/"],
    },
  },
  {
    title: "Open Source AI",
    slug: "open-source-ai",
    description:
      "The best open-source model releases, tooling, and community projects — everything happening outside the closed labs.",
    frequency: "weekly",
    keywords: ["open source AI", "Llama", "Mistral", "Hugging Face", "open weights", "community model"],
    sources: {
      rss: ["https://huggingface.co/blog/feed.xml"],
      twitter_queries: ["open source model release", "open weights AI", "huggingface new model"],
      sites: ["https://huggingface.co/blog", "https://ollama.com/blog"],
    },
  },
  {
    title: "AI Infrastructure",
    slug: "ai-infrastructure",
    description:
      "GPUs, training clusters, inference optimization, serving frameworks, and the compute layer powering the AI boom.",
    frequency: "weekly",
    keywords: ["AI infrastructure", "GPU", "CUDA", "inference", "vLLM", "TensorRT", "training cluster", "H100"],
    sources: {
      rss: ["https://arxiv.org/rss/cs.DC"],
      twitter_queries: ["AI inference optimization", "GPU cluster training", "vLLM serving"],
      sites: ["https://developer.nvidia.com/blog", "https://pytorch.org/blog/"],
    },
  },
  {
    title: "AI Research Papers",
    slug: "ai-research-papers",
    description:
      "The most-cited and most-discussed papers from arXiv and top ML venues — summarized so you can stay current without reading every PDF.",
    frequency: "weekly",
    keywords: ["arXiv", "NeurIPS", "ICML", "ICLR", "ML paper", "research", "transformer", "diffusion"],
    sources: {
      rss: [
        "https://arxiv.org/rss/cs.LG",
        "https://arxiv.org/rss/cs.AI",
        "https://arxiv.org/rss/cs.CL",
      ],
      twitter_queries: ["new arXiv paper ML", "NeurIPS ICML paper", "AI research paper"],
      sites: ["https://paperswithcode.com"],
    },
  },
  {
    title: "AI in Products",
    slug: "ai-in-products",
    description:
      "How companies are shipping AI features — product launches, UX patterns, and what's actually working in production.",
    frequency: "weekly",
    keywords: ["AI product", "AI feature launch", "LLM product", "AI startup", "product AI integration"],
    sources: {
      rss: ["https://www.producthunt.com/feed"],
      twitter_queries: ["launched AI feature", "AI product update", "new AI tool"],
      sites: ["https://every.to", "https://lenny.substack.com"],
    },
  },
  {
    title: "Startup & Founder Digest",
    slug: "startup-founder-digest",
    description:
      "Fundraising news, founder essays, YC batch updates, and the ideas shaping the next generation of tech companies.",
    frequency: "weekly",
    keywords: ["startup", "YC", "seed round", "Series A", "founder", "venture capital", "product-market fit"],
    sources: {
      rss: ["https://news.ycombinator.com/rss", "https://techcrunch.com/feed/"],
      twitter_queries: ["YC startup launch", "seed funding announcement", "founder essay"],
      sites: ["https://paulgraham.com", "https://techcrunch.com"],
    },
  },
];

async function main() {
  console.log("Seeding system newsletters...");

  for (const newsletter of systemNewsletters) {
    await prisma.newsletter.upsert({
      where: { slug: newsletter.slug },
      update: {},
      create: {
        ...newsletter,
        isPublic: true,
        isSystem: true,
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
