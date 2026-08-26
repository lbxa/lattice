import { RetroButton } from "@/components/chrome/RetroButton";
import { site } from "@/content/site";

type WelcomeWindowProps = {
  onBrowse: () => void;
  onAbout: () => void;
};

export function WelcomeWindow({ onBrowse, onAbout }: WelcomeWindowProps) {
  return (
    <div className="flex flex-col gap-3 p-4 font-sans text-sm leading-relaxed">
      <h2 className="border-b border-outline/20 pb-2 font-pixel text-xl">
        {site.welcome.heading}
      </h2>
      {site.welcome.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <div className="mt-1 flex gap-2">
        <RetroButton onClick={onBrowse}>Open a project</RetroButton>
        <RetroButton onClick={onAbout}>About</RetroButton>
      </div>
    </div>
  );
}
