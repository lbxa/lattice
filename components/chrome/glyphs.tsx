type GlyphProps = { className?: string };

/**
 * Pixel-art glyphs in a Windows 98 x vintage-Mac hybrid style: Win98's
 * manila-and-bevel color modelling (highlight top-left, shadow bottom-right,
 * a dithered transition row) inside hard 1px Mac-style black outlines.
 */

/** Manila folder, 16×12 grid scaled 3×. */
export function FolderGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 16 12"
      width="48"
      height="36"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {/* Outline silhouette: tab + body. */}
      <path d="M1 1h6v2h8v8H1z" fill="#2b241a" />
      {/* Body fill. */}
      <path d="M2 2h4v2h9v6H2z" fill="#f3d97a" />
      {/* Sunlit top: tab ridge and the body's first row. */}
      <path d="M2 2h4v1H2zM2 4h12v1H2z" fill="#fff8cd" />
      {/* Shadowed bottom row and right column. */}
      <path d="M2 9h12v1H2zM13 4h1v5h-1z" fill="#c9a53d" />
      {/* Dithered transition row above the shadow. */}
      <path
        d="M3 8h1v1H3zM5 8h1v1H5zM7 8h1v1H7zM9 8h1v1H9zM11 8h1v1h-1z"
        fill="#c9a53d"
      />
    </svg>
  );
}

/** Document with a folded corner, 12×14 grid scaled 3×. */
export function DocGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 12 14"
      width="36"
      height="42"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {/* Outline silhouette with the corner cut. */}
      <path d="M2 1h6v3h3v9H2z" fill="#2b241a" />
      {/* Page. */}
      <path d="M3 2h4v3h3v7H3z" fill="#ffffff" />
      {/* Folded corner: dark crease and its paper-shadow. */}
      <path d="M8 1l3 3h-3z" fill="#2b241a" />
      <path d="M7 2h1v2h2v1H7z" fill="#cfc9b8" />
      {/* Title rule in classic system blue, body lines in ink gray. */}
      <path d="M4 6h5v1H4z" fill="#2f5ec4" />
      <path d="M4 8h5v1H4zM4 10h5v1H4z" fill="#5a544a" />
      {/* Bottom-edge shadow. */}
      <path d="M3 11h6v1H3z" fill="#cfc9b8" />
    </svg>
  );
}

/**
 * The Lattice mark: two equal squares offset diagonally and bridged by a
 * parallelogram that shares each square's facing edge — the lattice cell.
 *
 * Rebuilt as geometry rather than traced, because the only surviving copy was a
 * low-resolution render. Three numbers define it, so correcting the proportions
 * against the original artwork is a one-line change:
 *
 *   side 12 · gap 4 · rise 6   →   56° connector, 50% vertical overlap, 3:2 box
 *
 * Stroked in `currentColor` so it inverts to white on its own when the menu-bar
 * trigger takes the selected state, and inherits window ink everywhere else.
 */
export function MarkGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 30 20"
      width="24"
      height="16"
      fill="none"
      stroke="currentColor"
      // 1.5 on a 12-unit side ≈ the reference's stroke-to-square ratio. Heavier
      // reads as a UI icon rather than a logo; lighter breaks up at 16px.
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      {/* Lower-left cell. */}
      <rect x="1" y="7" width="12" height="12" />
      {/* Upper-right cell. */}
      <rect x="17" y="1" width="12" height="12" />
      {/* The bridge: parallel diagonals joining the two facing edges. */}
      <path d="M13 7 17 1M13 19 17 13" />
    </svg>
  );
}
