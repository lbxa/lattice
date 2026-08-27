import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";

/**
 * Required under `output: "export"`: metadata routes compile to Route
 * Handlers, and Next refuses to prerender one into the static export unless it
 * explicitly opts in. Without this the build fails at page-data collection.
 */
export const dynamic = "force-static";

/**
 * Prerendered to `out/sitemap.xml` at build time — no server involved.
 *
 * Lattice is a single route: projects open as windows on the desktop rather
 * than as separate URLs, so there is exactly one page to declare. Add entries
 * here if that ever changes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      // Build time, not `new Date()` at request time — the export is static,
      // so this is stamped once per deploy, which is the honest answer.
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
