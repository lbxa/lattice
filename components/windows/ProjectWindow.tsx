import Image from "next/image";
import { RetroLink } from "@/components/chrome/RetroButton";
import { FolderGlyph } from "@/components/chrome/glyphs";
import type { Project } from "@/content/projects";

export function ProjectWindow({ project }: { project: Project }) {
  const hero = project.images[0];
  return (
    <article className="flex flex-col gap-3 p-4 font-sans text-sm leading-relaxed">
      <header className="flex items-center gap-3 border-b border-outline/20 pb-3">
        <FolderGlyph />
        <div className="min-w-0">
          <h2 className="truncate font-pixel text-lg">{project.title}</h2>
          <p className="truncate text-chrome-dim">
            {project.tagline}
            {project.year ? ` · ${project.year}` : ""}
          </p>
        </div>
      </header>
      {hero && (
        <Image
          src={hero.src}
          alt={hero.alt}
          width={800}
          height={450}
          className="h-auto w-full border border-outline"
        />
      )}
      {project.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <footer className="mt-1 flex flex-wrap gap-2">
        {project.links.map((link) => (
          <RetroLink key={link.label} href={link.href}>
            {link.label}
          </RetroLink>
        ))}
      </footer>
    </article>
  );
}
