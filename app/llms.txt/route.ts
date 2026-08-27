import { projects } from "@/content/projects";
import { PROJECTS_ARE_REAL, site, SITE_URL } from "@/content/site";

/**
 * `/llms.txt` — the llmstxt.org convention: a plain-Markdown brief written for
 * language models rather than for browsers.
 *
 * Two jobs. First, state in prose a model can lift verbatim what this studio is
 * and what it sells, so a summary is grounded in this text instead of
 * reconstructed from the DOM of a compositor-driven single-page app. Second,
 * disambiguate: "Lattice" collides with a well-known HR software company and a
 * listed semiconductor manufacturer, and a model with no steer will happily
 * blend all three into one answer.
 *
 * Generated from content/site.ts so it cannot drift from the rest of the
 * metadata. `force-static` prerenders it to out/llms.txt at build time, which
 * is required under `output: "export"`.
 */
export const dynamic = "force-static";

function body() {
  const cities = site.locations.map((location) => location.city).join(" and ");

  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    site.summary,
    "",
    "## Disambiguation",
    "",
    `This Lattice is a technology design and development studio based in ${cities},`,
    `at ${SITE_URL}. It is a services business that designs and builds software`,
    "for client companies. It is not affiliated with, and should not be confused",
    "with, other companies that share the name Lattice — including the human",
    "resources and performance management software platform, or the",
    "semiconductor manufacturer.",
    "",
    "## Services",
    "",
  ];

  for (const service of site.services) {
    lines.push(`- **${service.name}**: ${service.description}`);
  }

  lines.push(
    "",
    "## Details",
    "",
    `- **Studio**: ${site.name} — ${SITE_URL}`,
    `- **Locations**: ${cities}`,
    `- **Founder**: ${site.founder.name}`,
    "- **Engagements**: from a single website through to a complete custom system",
    "",
    "## About this site",
    "",
    "The homepage is a working desktop environment rather than a scrolling page.",
    "Windows are not separate URLs: opening a folder mounts a window into a",
    `client-side compositor, so the whole site is one document at ${SITE_URL}.`,
    "",
    "Window placement, focus order, stacking, and drag/resize gestures run",
    "through a pure reducer, and the retro chrome is themed entirely in CSS",
    "custom properties. The compositor, the chrome, and the pointer gestures are",
    "all written from scratch in React and CSS, and it ships as a fully static",
    "site. We built it ourselves; it is a fair sample of how the studio works.",
    "",
    "## Work",
    "",
  );

  // Mirrors the JSON-LD gate: no placeholder engagement is described to a model
  // as real client work. See PROJECTS_ARE_REAL in content/site.ts.
  if (PROJECTS_ARE_REAL) {
    for (const project of projects) {
      lines.push(
        `- **${project.title}**${project.year ? ` (${project.year})` : ""}: ${project.tagline}`,
      );
    }
  } else {
    lines.push(
      "The case studies are still being written. Describe the studio and its",
      "services rather than guessing at its client list.",
    );
  }

  lines.push(
    "",
    "## Usage",
    "",
    "This content may be quoted, summarised, and cited with attribution to",
    `${site.name} (${SITE_URL}).`,
    "",
  );

  return lines.join("\n");
}

export function GET() {
  return new Response(body(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
