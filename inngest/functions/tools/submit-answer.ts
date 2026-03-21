import { tool } from "ai";
import { type DigestContent, DigestSchema } from "../newsletter-agent";

export function makeSubmitAnswerTool(
  onSubmit: (digest: DigestContent) => void,
) {
  return tool({
    description:
      "Submit the final structured newsletter content once you have gathered enough research. This ends the research loop.",
    inputSchema: DigestSchema,
    execute: async (digest) => {
      onSubmit(digest);
      return digest;
    },
  });
}
