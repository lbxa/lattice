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

/** Site mark for the menu bar: a shaded pixel cloud, 14×10 grid. */
export function MarkGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 14 10"
      width="21"
      height="15"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      <path d="M4 2h4v2h3v2h2v3H1V6h1V4h2z" fill="#ffffff" />
      {/* Shaded underside, matching the sky's cumulus sprites. */}
      <path d="M2 8h10v1H2z" fill="#b9cbe6" />
      <path
        d="M4 2h4v2h3v2h2v3H1V6h1V4h2z"
        fill="none"
        stroke="#2b241a"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}
