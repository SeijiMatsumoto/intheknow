export type CandidateItem = {
  id: string;
  title: string;
  url: string;
  content: string;
  source: string;
  sourceType: "rss" | "twitter" | "site";
  publishedAt: string; // ISO string
  engagement?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    score?: number; // HN / Reddit score
  };
  freshnessScore: number; // 0–10
  worthScore: number;    // 0–10
  combinedScore: number; // 0–10
};

