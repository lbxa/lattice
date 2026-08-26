export type Project = {
  id: string;
  title: string;
  tagline: string;
  year?: string;
  paragraphs: string[];
  links: { label: string; href: string }[];
  images: { src: string; alt: string }[]; // files under public/projects/
  windowSize?: { w: number; h: number };
};

const placeholderParagraphs = (name: string): string[] => [
  `Placeholder copy — describe what ${name} is, who it's for, and the problem it solves in two or three sentences.`,
  "A second paragraph for the interesting build details: the constraint you fought, the trick that made it work, the part you're proud of.",
];

const placeholderLinks = [
  { label: "Visit", href: "#" },
  { label: "Source", href: "#" },
];

export const projects: Project[] = [
  {
    id: "aurora",
    title: "Aurora",
    tagline: "Ambient weather for your menu bar",
    year: "2024",
    paragraphs: placeholderParagraphs("Aurora"),
    links: placeholderLinks,
    images: [],
  },
  {
    id: "meridian",
    title: "Meridian",
    tagline: "Field notes that sync when the trail doesn't",
    year: "2024",
    paragraphs: placeholderParagraphs("Meridian"),
    links: placeholderLinks,
    images: [],
  },
  {
    id: "pixelforge",
    title: "PixelForge",
    tagline: "A tiny sprite editor that fits in a tweet",
    year: "2023",
    paragraphs: placeholderParagraphs("PixelForge"),
    links: placeholderLinks,
    images: [],
  },
  {
    id: "signalbox",
    title: "Signalbox",
    tagline: "Home-lab dashboards without the YAML",
    year: "2025",
    paragraphs: placeholderParagraphs("Signalbox"),
    links: placeholderLinks,
    images: [],
  },
  {
    id: "papertrail",
    title: "Papertrail",
    tagline: "Receipts in, spreadsheets out",
    year: "2025",
    paragraphs: placeholderParagraphs("Papertrail"),
    links: placeholderLinks,
    images: [],
  },
];
