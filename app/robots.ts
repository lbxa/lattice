import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";

/**
 * Required under `output: "export"`: metadata routes compile to Route
 * Handlers, and Next refuses to prerender one into the static export unless it
 * explicitly opts in. Without this the build fails at page-data collection.
 */
export const dynamic = "force-static";

/**
 * Crawlers that build or ground generative models. A bare `User-agent: *`
 * already permits all of these, but naming them makes the stance explicit and
 * greppable: this site *wants* to be read, summarised, and cited by LLMs.
 *
 * Move a name into a `disallow` rule to opt out of that crawler specifically.
 */
const AI_CRAWLERS = [
  "GPTBot", // OpenAI, model training
  "OAI-SearchBot", // OpenAI, ChatGPT search index
  "ChatGPT-User", // OpenAI, live fetch on a user's behalf
  "ClaudeBot", // Anthropic, model training
  "Claude-User", // Anthropic, live fetch on a user's behalf
  "Claude-SearchBot", // Anthropic, search index
  "PerplexityBot", // Perplexity index
  "Perplexity-User", // Perplexity live fetch
  "Google-Extended", // Gemini training / grounding (separate from Googlebot)
  "Applebot-Extended", // Apple Intelligence
  "meta-externalagent", // Meta AI
  "Bytespider", // ByteDance
  "cohere-ai",
];

/** Prerendered to `out/robots.txt` at build time. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
