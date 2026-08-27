import { MarkGlyph } from "@/components/chrome/glyphs";
import { site } from "@/content/site";

export function AboutWindow() {
  return (
    <div className="flex flex-col gap-3 p-4 font-sans text-sm leading-relaxed">
      <header className="flex items-center gap-3 border-b border-outline/20 pb-2">
        {/* Larger than the menu-bar instance: the mark reads as the logo here,
            not as a menu affordance. Width follows from the 3:2 viewBox. */}
        <MarkGlyph className="h-6 w-auto shrink-0" />
        <h2 className="font-pixel text-xl">{site.name}</h2>
      </header>
      {site.about.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}
