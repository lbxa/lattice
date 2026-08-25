"use client";

import { useEffect, useReducer } from "react";
import { DesktopIcon } from "@/components/chrome/DesktopIcon";
import { DocGlyph, FolderGlyph } from "@/components/chrome/glyphs";
import { MenuBar } from "@/components/chrome/MenuBar";
import { WindowFrame } from "@/components/chrome/WindowFrame";
import { Sky } from "@/components/sky/Sky";
import { AboutWindow } from "@/components/windows/AboutWindow";
import { ProjectWindow } from "@/components/windows/ProjectWindow";
import { WelcomeWindow } from "@/components/windows/WelcomeWindow";
import { WindowContentBoundary } from "@/components/windows/WindowContentBoundary";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { desktopReducer, initialDesktopState } from "./desktopReducer";
import { useIsMobile } from "./useIsMobile";
import type { Size, Viewport, WindowKind, WindowState } from "./types";

const SIZES: Record<WindowKind, Size> = {
  welcome: { w: 400, h: 320 },
  about: { w: 380, h: 300 },
  project: { w: 480, h: 380 },
};

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function Desktop() {
  const [state, dispatch] = useReducer(desktopReducer, undefined, initialDesktopState);
  const isMobile = useIsMobile();

  // Keep every window reachable when the browser window changes size.
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        dispatch({ type: "CLAMP_ALL", viewport: viewport() }),
      );
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const open = (kind: WindowKind, projectId?: string) =>
    dispatch({
      type: "OPEN",
      kind,
      projectId,
      size:
        kind === "project"
          ? (projects.find((p) => p.id === projectId)?.windowSize ?? SIZES.project)
          : SIZES[kind],
      viewport: viewport(),
    });

  const focusedId = state.order.at(-1);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Sky />
      <MenuBar
        siteName={site.name}
        hasWindows={state.order.length > 0}
        onAbout={() => open("about")}
        onCloseTop={() => {
          if (focusedId) dispatch({ type: "CLOSE", id: focusedId });
        }}
        onCloseAll={() => dispatch({ type: "CLOSE_ALL" })}
        onCleanUp={() => dispatch({ type: "CLEAN_UP", viewport: viewport() })}
      />
      <div className="absolute bottom-3 right-3 top-10 flex flex-col items-center gap-4 max-sm:static max-sm:mt-10 max-sm:grid max-sm:grid-cols-3 max-sm:justify-items-center max-sm:px-4">
        {projects.map((project) => (
          <DesktopIcon
            key={project.id}
            label={project.title}
            glyph={<FolderGlyph />}
            onOpen={() => open("project", project.id)}
          />
        ))}
        <DesktopIcon
          label={site.welcome.title}
          glyph={<DocGlyph />}
          onOpen={() => open("welcome")}
        />
      </div>
      {state.order.map((id, index) => {
        const win = state.windows[id];
        return (
          <WindowFrame
            key={id}
            win={win}
            title={titleOf(win)}
            focused={id === focusedId}
            zIndex={10 + index}
            gesturesEnabled={!isMobile}
            dispatch={dispatch}
          >
            <WindowContentBoundary>
              {contentOf(win, open)}
            </WindowContentBoundary>
          </WindowFrame>
        );
      })}
    </div>
  );
}

function titleOf(win: WindowState): string {
  if (win.kind === "welcome") return site.welcome.title;
  if (win.kind === "about") return site.about.title;
  return projects.find((p) => p.id === win.projectId)?.title ?? "Untitled";
}

function contentOf(
  win: WindowState,
  open: (kind: WindowKind, projectId?: string) => void,
) {
  if (win.kind === "welcome") {
    return (
      <WelcomeWindow
        onBrowse={() => open("project", projects[0].id)}
        onAbout={() => open("about")}
      />
    );
  }
  if (win.kind === "about") return <AboutWindow />;
  const project = projects.find((p) => p.id === win.projectId);
  return project ? <ProjectWindow project={project} /> : null;
}
