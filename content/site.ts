/**
 * Everything a crawler, a social unfurler, or a language model reads about
 * this site is derived from this file. `app/layout.tsx`, `app/sitemap.ts`,
 * `app/robots.ts`, `app/manifest.ts`, `app/opengraph-image.tsx` and
 * `app/llms.txt/route.ts` all import from here — edit copy in this file, never
 * in the metadata routes themselves.
 *
 * Lattice is a company, not a personal site: the publisher of record everywhere
 * below is the studio. The founder appears only as a linked `Person` node in
 * the schema.org graph.
 */

/**
 * Canonical origin, no trailing slash.
 *
 * This feeds `metadataBase`, which is what makes every relative URL in the
 * metadata tree (the OG image, the canonical link) resolve to an absolute one.
 * Relative `og:image` URLs are silently discarded by Slack, iMessage, Facebook
 * and most LLM fetchers, so getting this wrong fails quietly rather than loudly.
 */
export const SITE_URL = "https://lattice.lbxa.net";

export const site = {
  name: "Lattice",
  tagline: "Technology Design & Development Studio",

  /**
   * Meta description and OG/Twitter description, kept under 160 characters so
   * search engines show it whole.
   *
   * It leads with "Lattice is a …" so entity extractors get a clean
   * subject-predicate, and names the category and both cities in the first
   * sentence. That disambiguation is load-bearing: the name collides with a
   * large HR software company and a listed semiconductor manufacturer, so the
   * category is what tells a reader — or a model — which Lattice this is.
   */
  description:
    "Lattice is a technology design and development studio in Sydney and New York. We design and build websites, web apps, and cloud systems for businesses.",

  /** Longer form, for JSON-LD and llms.txt where there is no length budget. */
  summary:
    "Lattice is a technology design and development studio with teams in Sydney and New York. We work with businesses to design and build software: marketing sites and web applications, product and interface design, and the cloud infrastructure and integrations that sit behind them. Engagements range from a single website through to a complete system built around how a business actually operates.",

  /** Feeds the schema.org service catalogue and the llms.txt services list. */
  services: [
    {
      name: "Websites and web applications",
      description:
        "Marketing sites, ecommerce, and custom web applications — designed, built, and shipped.",
    },
    {
      name: "Product and UI/UX design",
      description:
        "Interface design, design systems, and product direction, sold either on its own or as part of a build.",
    },
    {
      name: "Cloud, infrastructure and integrations",
      description:
        "Hosting, APIs, third-party integrations, and the data plumbing that keeps a system running.",
    },
  ],

  /**
   * City-level only. Google's local rich results need a street address and a
   * public phone number, so these are declared as `location` on a plain
   * `Organization` rather than as `LocalBusiness` — truthful, and it avoids
   * emitting a business type with required fields left blank.
   */
  locations: [
    { city: "Sydney", region: "NSW", country: "AU" },
    { city: "New York", region: "NY", country: "US" },
  ],

  founder: {
    name: "Lucas Barbosa",
    url: "https://github.com/lbxa",
  },

  // No public contact channel is published yet. When there is one, add it here
  // and wire it into components/seo/JsonLd.tsx as a `contactPoint`, plus any
  // company profile URLs as `sameAs` — `sameAs` is the strongest signal
  // available for separating this Lattice from the others sharing the name.
  //
  //   contact: { email: "hello@…", profiles: ["https://linkedin.com/company/…"] },

  /**
   * Long-tail by design. Competing for the bare word "Lattice" is not winnable;
   * category plus city plus service is.
   */
  keywords: [
    "Lattice studio",
    "technology design and development studio",
    "software development studio Sydney",
    "web development studio New York",
    "custom web application development",
    "UI UX design studio",
    "cloud infrastructure and integrations",
    "software studio for business",
  ],

  /** Deep sky blue — tints mobile browser chrome and the PWA title bar. */
  themeColor: "#2557b8",
  /** Matches `body { background }` in globals.css, so splash screens match. */
  backgroundColor: "#cfe4f6",

  welcome: {
    title: "Read Me",
    heading: "Welcome to Lattice",
    paragraphs: [
      "Lattice is a technology design and development studio. This desktop is our studio — each folder holds a piece of work. Open one to take a look around.",
      "Drag windows by their title bars, stack them, collapse them with a double-click, tidy up from the View menu. It all works the way you'd hope.",
    ],
  },

  about: {
    title: "About",
    paragraphs: [
      "Lattice is a technology design and development studio with teams in Sydney and New York. We design and build software for businesses — websites and web applications, product and interface design, and the cloud infrastructure behind them.",
      "Engagements range from a single site through to a complete system built around how a business actually runs.",
      "This site is one of our own: a hand-built desktop environment with a real window compositor, a retro UI kit, and a drifting sky — the compositor, chrome, and pointer gestures all written from scratch in React and CSS.",
    ],
  },
} as const;
