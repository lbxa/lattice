import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/**
 * Required under `output: "export"`: metadata routes compile to Route
 * Handlers, and Next refuses to prerender one into the static export unless it
 * explicitly opts in. Without this the build fails at page-data collection.
 */
export const dynamic = "force-static";

/**
 * Replaces the hand-edited `public/site.webmanifest` that RealFaviconGenerator
 * emitted, which still carried its "MyWebSite" placeholder name. Generating it
 * keeps the installed-app name in step with `content/site.ts`, and Next injects
 * the `<link rel="manifest">` tag automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    theme_color: site.themeColor,
    background_color: site.backgroundColor,
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
