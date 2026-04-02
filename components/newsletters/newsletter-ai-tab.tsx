"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import {
  type GeneratedNewsletter,
  generateNewsletterFields,
} from "@/app/actions/generate-newsletter";

type Props = {
  onGenerated: (data: GeneratedNewsletter) => void;
  error: string | null;
  onError: (error: string | null) => void;
};

export function NewsletterAiTab({ onGenerated, error, onError }: Props) {
  const [prompt, setPrompt] = useState("");
  const [generating, startTransition] = useTransition();

  function handleGenerate() {
    if (!prompt.trim()) return;
    onError(null);
    startTransition(async () => {
      const result = await generateNewsletterFields(prompt);
      if (result.error) {
        onError(result.error);
      } else if (result.data) {
        onGenerated(result.data);
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Describe the newsletter you want and AI will configure everything for
        you.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. A weekly digest of the latest AI agent frameworks, new LLM releases, and practical agentic coding tools for engineers…"
        rows={5}
        className="w-full resize-none rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity disabled:opacity-50"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {generating ? "Generating…" : "Generate"}
      </button>
    </div>
  );
}
