import { MarkGlyph } from "@/components/chrome/glyphs";
import { site } from "@/content/site";

export function AboutWindow() {
  return (
    <div className="flex flex-col gap-3 p-4 font-sans text-sm leading-relaxed">
      <header className="flex items-center gap-2 border-b border-outline/20 pb-2">
        <MarkGlyph />
        <h1 className="font-pixel text-xl">{site.name}</h1>
      </header>
      {site.about.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}
