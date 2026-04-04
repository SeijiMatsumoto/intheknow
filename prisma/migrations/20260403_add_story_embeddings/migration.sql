-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to digest_stories
ALTER TABLE "digest_stories" ADD COLUMN "embedding" vector(1536);

-- Create ivfflat index for cosine similarity search
CREATE INDEX "digest_stories_embedding_idx" ON "digest_stories"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
