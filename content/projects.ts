/**
 * The studio's work, rendered as folders on the desktop.
 *
 * Order matters twice over: this is the top-to-bottom order of the desktop
 * icons, and `projects[0]` is what the Welcome window's "Browse" button opens
 * (see `onBrowse` in components/desktop/Desktop.tsx), so the first entry is the
 * first thing most visitors read.
 *
 * `id` is also the storage key for a dragged icon's position
 * (see ICON_LAYOUT_KEY in components/desktop/iconLayout.ts). Renaming one is
 * safe but discards that icon's saved placement for anyone mid-session.
 *
 * Copy is written to be read in a 480×380 window; the window body scrolls, so
 * length is a taste constraint rather than a hard one. Two paragraphs — what
 * the site is and who it's for, then what was interesting to build — is the
 * house pattern.
 *
 * EVERY ENTRY HERE IS REAL, DELIVERED WORK. There is no longer a flag gating
 * this file out of the machine-readable surfaces: components/seo/JsonLd.tsx
 * emits each project as a schema.org `CreativeWork` with Lattice as `creator`,
 * and app/llms.txt/route.ts lists it to language models. Adding a speculative
 * or aspirational entry publishes a false claim of authorship, which is far
 * easier to emit than it is to retract.
 */
export type Project = {
  id: string;
  title: string;
  tagline: string;
  year?: string;
  /**
   * Canonical URL of the work itself, when it is publicly reachable.
   *
   * Deliberately separate from `links`, because they answer different
   * questions. `links` is navigation for a human — it may point at a client's
   * homepage, or anywhere else worth sending someone. `url` is a claim, and the
   * only place the schema.org graph will say "the thing Lattice made lives
   * here".
   *
   * Omit it when we built part of an estate we do not own, or something since
   * retired: the `CreativeWork` still carries `creator: Lattice`, so the credit
   * survives without asserting we built whatever sits at that domain today.
   */
  url?: string;
  paragraphs: string[];
  links: { label: string; href: string }[];
  images: { src: string; alt: string }[]; // files under public/projects/
  windowSize?: { w: number; h: number };
};

export const projects: Project[] = [
  {
    id: "cercle",
    title: "Cercle",
    tagline: "Drink it, drop it, do it again",
    // No `url`: we built the consumer app, not cercle.com.au, and the app has
    // since been retired. The credit stands; the URL claim would not.
    paragraphs: [
      "Cercle replaces single-use cups and containers with a reusable system built around what people already do: drink it, drop it in a pod, do it again. It runs across precincts, venues, workplaces, events, cafes and councils around Australia.",
      "We built the consumer half of that loop — the app for scanning a cup out at the counter, finding the nearest Drop Pod, and checking it back in. Reuse schemes live or die on friction: a return has to be quicker than walking to a bin, which puts the whole interaction inside one scan taken by someone already holding a coffee and moving. The app has since been retired; the system it served is still running.",
    ],
    links: [{ label: "Cercle", href: "https://www.cercle.com.au" }],
    images: [],
  },
  {
    id: "jazmyn-gillies",
    url: "https://jazmyngillies.com",
    title: "Jazmyn Gillies",
    tagline: "Music video production, set in type",
    year: "2026",
    paragraphs: [
      "A portfolio for a creative producer working across music, entertainment and culture in Australia and the US, with production and creative assist credits on videos for Tate McRae, Childish Gambino, Megan Thee Stallion, LISA and Starley.",
      "The video is the content, so the design gets out of its way: full-bleed capitals, credits stacked like a call sheet, and a portfolio split into short and long form with the TikTok and Instagram numbers attached to each piece. Static Astro, so a page of heavy media still opens fast.",
    ],
    links: [{ label: "Visit", href: "https://jazmyngillies.com" }],
    images: [{ src: "/projects/jazmyn-gillies.webp", alt: "The Jazmyn Gillies homepage: a full-bleed video still behind her name in condensed capitals, with the selected-work credits listed down the right-hand side." }],
  },
  {
    id: "green-house",
    url: "https://greenhouseau.com",
    title: "Green House",
    tagline: "Holding the name until the doors open",
    year: "2026",
    paragraphs: [
      "Green House is an independent creative community in Sydney, grown out of one idea — creative people need creative people — into sold-out events, partnerships and a digital platform for emerging talent. The full site is still being written.",
      "This is what stands in the meantime: the wordmark stacked across the full width of the viewport in cream over a burnt-orange gradient, one link to Instagram, and the current Sydney temperature fetched live along the bottom. A launch page earns its keep by being unmistakably the brand and giving people one thing to do — the weather is just proof that someone is home.",
    ],
    links: [{ label: "Visit", href: "https://greenhouseau.com" }],
    images: [{ src: "/projects/green-house.webp", alt: "The Green House launch page: the wordmark stacked across two lines in cream over a burnt-orange gradient, above the line “Website launching soon” and an Instagram link." }],
  },
  {
    id: "gabriella-cardoso",
    url: "https://gabriellacardoso.org",
    title: "Gabriella Cardoso",
    tagline: "A researcher's CV that carries her writing",
    year: "2026",
    paragraphs: [
      "A single page for a policy researcher in international political economy: education, work and languages up front, from a master's at Leiden and the Clingendael Institute through to directing media campaigns at a grassroots climate and human rights organisation.",
      "The weight sits behind the Writing link — full essays with reference lists, on the alternatives to SWIFT and on platform capitalism's pull against the liberal order, alongside a plain-language explainer written for the Muswellbrook community facing the end of coal. Academic apparatus that still reads on a phone.",
    ],
    links: [{ label: "Visit", href: "https://gabriellacardoso.org" }],
    images: [{ src: "/projects/gabriella-cardoso.webp", alt: "The Gabriella Cardoso homepage: a serif wordmark above a navy navigation bar, a photograph of a conference session, and the opening of her introduction." }],
  },
  {
    id: "oliver-barbosa",
    url: "https://oliverbarbosa.com",
    title: "Oliver Barbosa",
    tagline: "A civil engineering portfolio that shows the working",
    year: "2026",
    paragraphs: [
      "A portfolio for an undergraduate civil engineer at UNSW, built to put evidence in front of a recruiter instead of adjectives. Four projects — remediating a contaminated light rail stabling yard at Camellia, a pedestrian bridge, a Revit documentation set, a morphing airfoil — each split into what was designed, how it was analysed, and what the numbers came out at.",
      "Discipline tabs filter the work in place, so a structural reader and a geotechnical one each land on their own material without a page load. It ships as static Astro on Cloudflare: everything is HTML by the time a browser sees it, and the load figures stay legible on a phone.",
    ],
    links: [{ label: "Visit", href: "https://oliverbarbosa.com" }],
    images: [{ src: "/projects/oliver-barbosa.webp", alt: "The Oliver Barbosa homepage: “Practical design. Modelling. Analysis.” set in heavy black type beside a collage of site plans, Revit models and a wind tunnel rig." }],
  },
  {
    id: "lucas-barbosa",
    url: "https://lucasbarbosa.net",
    title: "Lucas Barbosa",
    tagline: "Personal site, terminal-flavoured",
    year: "2026",
    paragraphs: [
      "The founder's own site, and an index of what he has shipped: post-trained vision-language-action models for robotics, trust infrastructure for AI-era media, an audit platform chewing through thousands of events a second, and the writing and reading that sit around all of it.",
      "Monospaced and bracket-linked like a terminal, with a dark mode toggle, WebGL sculptures turning in the page, and a Tetris board hidden in the nav. Astro with view transitions, so moving between sections never blanks the screen.",
    ],
    links: [{ label: "Visit", href: "https://lucasbarbosa.net" }],
    images: [{ src: "/projects/lucas-barbosa.webp", alt: "The lucasbarbosa.net homepage in dark mode: bracketed terminal-style navigation above a short introduction, with a bronze Lady Justice sculpture rendered below in WebGL." }],
  },
];
