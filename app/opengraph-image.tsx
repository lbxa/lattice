import { ImageResponse } from "next/og";
import { site, SITE_URL } from "@/content/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Required under `output: "export"`: metadata routes compile to Route
 * Handlers, and Next refuses to prerender one into the static export unless it
 * explicitly opts in. Without this the build fails at page-data collection.
 */
export const dynamic = "force-static";

// Straight from the `:root` block in app/globals.css — the card is the desktop.
const OUTLINE = "#26231e";
const CHROME = "#e8e5de";
const INK = "#1a1815";
const DIM = "#6f6a5e";
const BEVEL_LIGHT = "#ffffff";
const BEVEL_DARK = "#a8a49a";
const SKY = "linear-gradient(to bottom, #2557b8 0%, #3f7ad2 30%, #7db2e8 65%, #cfe4f6 100%)";

const HOST = new URL(SITE_URL).host;
const FOOTER = `${HOST}   ·   ${site.locations.map((l) => l.city).join("  ·  ")}`;

/**
 * Fetch a Google font as raw TrueType, subset to just the glyphs we draw.
 *
 * Two non-obvious constraints:
 *  - Satori cannot parse woff2. Google Fonts decides the format from the
 *    request's User-Agent, and only returns `format('truetype')` when it does
 *    not recognise one — so this must NOT send a UA header. (The widely copied
 *    snippet that spoofs a browser UA gets woff back and fails.)
 *  - Supplying `fonts` replaces ImageResponse's built-in default, so every
 *    family referenced in the JSX has to be loaded here.
 *
 * `next build` already reaches Google Fonts for next/font, so this adds no new
 * build-time dependency. Subsetting keeps both faces to a few KB, well inside
 * the 500KB ImageResponse bundle budget.
 */
async function googleFont(family: string, weight: number, text: string) {
  const api = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(api).then((r) => r.text());
  const url = /src: url\((https:\/\/[^)]+)\) format\('truetype'\)/.exec(css)?.[1];
  if (!url) throw new Error(`No TrueType source for ${family} ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

/** Classic System 7 title-bar texture, drawn as discrete rules. */
function Pinstripes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 3 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: 2, background: BEVEL_DARK }} />
      ))}
    </div>
  );
}

export default async function OpenGraphImage() {
  const [pixel, sans] = await Promise.all([
    googleFont("Pixelify Sans", 700, site.name + site.tagline),
    googleFont("Geist", 500, site.description + FOOTER),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: SKY,
          fontFamily: "Geist",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 1000,
            background: CHROME,
            border: `4px solid ${OUTLINE}`,
            // Hard-edged shadow: this era of UI had no blur.
            boxShadow: `14px 14px 0 rgba(38, 35, 30, 0.32), inset 2px 2px 0 ${BEVEL_LIGHT}, inset -2px -2px 0 ${BEVEL_DARK}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              height: 78,
              padding: "0 22px",
              borderBottom: `4px solid ${OUTLINE}`,
            }}
          >
            {/* Close box */}
            <div
              style={{
                width: 26,
                height: 26,
                border: `3px solid ${OUTLINE}`,
                background: CHROME,
                boxShadow: `inset 2px 2px 0 ${BEVEL_LIGHT}, inset -2px -2px 0 ${BEVEL_DARK}`,
              }}
            />
            <Pinstripes />
            <div style={{ fontFamily: "Pixelify Sans", fontSize: 40, color: INK }}>
              {site.name}
            </div>
            <Pinstripes />
            <div style={{ width: 26 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", padding: "54px 62px 48px" }}>
            <div
              style={{
                fontFamily: "Pixelify Sans",
                fontSize: 72,
                lineHeight: 1.08,
                color: INK,
                letterSpacing: -1,
              }}
            >
              {site.tagline}
            </div>
            <div style={{ height: 30 }} />
            <div style={{ fontSize: 29, lineHeight: 1.45, color: DIM }}>
              {site.description}
            </div>
            <div style={{ height: 38 }} />
            <div style={{ height: 3, background: BEVEL_DARK }} />
            <div style={{ height: 22 }} />
            <div style={{ fontSize: 25, color: INK }}>{FOOTER}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pixelify Sans", data: pixel, weight: 700, style: "normal" },
        { name: "Geist", data: sans, weight: 500, style: "normal" },
      ],
    },
  );
}
