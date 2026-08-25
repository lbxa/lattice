type GlyphProps = { className?: string };

/** Pixel-art folder, 16×12 grid scaled 3×. */
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
      <path d="M1 3h5v1h9v7H1z" fill="#a8c4e6" />
      <path d="M1 2h5v1H1z" fill="#c3d7ef" />
      <path
        d="M1 2h5v1h9v8H1zM1 4h14"
        fill="none"
        stroke="#26231e"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Pixel-art document with a folded corner, 12×14 grid scaled 3×. */
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
      <path d="M2 1h6l3 3v9H2z" fill="#ffffff" />
      <path d="M8 1v3h3" fill="#d4d0c8" />
      <path
        d="M2 1h6l3 3v9H2zM8 1v3h3M4 6h5M4 8h5M4 10h5"
        fill="none"
        stroke="#26231e"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Site mark for the menu bar: a tiny pixel cloud. */
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
      <path
        d="M4 2h4v2h3v2h2v3H1V6h1V4h2z"
        fill="none"
        stroke="#26231e"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}
