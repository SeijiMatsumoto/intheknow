-- AlterTable
ALTER TABLE "digest_runs" ADD COLUMN     "agent_summary" TEXT,
ADD COLUMN     "bottom_line" TEXT,
ADD COLUMN     "edition_title" TEXT,
ADD COLUMN     "key_takeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skip_edition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "social_consensus_overview" TEXT,
ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "newsletter_sources" (
    "id" TEXT NOT NULL,
    "newsletter_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "newsletter_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digest_sections" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "digest_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digest_stories" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "quote" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "digest_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digest_story_sources" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "published_at" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "digest_story_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digest_social_highlights" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "engagement" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "digest_social_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "newsletter_sources_newsletter_id_idx" ON "newsletter_sources"("newsletter_id");

-- CreateIndex
CREATE INDEX "digest_sections_run_id_idx" ON "digest_sections"("run_id");

-- CreateIndex
CREATE INDEX "digest_stories_section_id_idx" ON "digest_stories"("section_id");

-- CreateIndex
CREATE INDEX "digest_story_sources_story_id_idx" ON "digest_story_sources"("story_id");

-- CreateIndex
CREATE INDEX "digest_social_highlights_run_id_idx" ON "digest_social_highlights"("run_id");

-- AddForeignKey
ALTER TABLE "newsletter_sources" ADD CONSTRAINT "newsletter_sources_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digest_sections" ADD CONSTRAINT "digest_sections_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "digest_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digest_stories" ADD CONSTRAINT "digest_stories_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "digest_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digest_story_sources" ADD CONSTRAINT "digest_story_sources_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "digest_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digest_social_highlights" ADD CONSTRAINT "digest_social_highlights_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "digest_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
