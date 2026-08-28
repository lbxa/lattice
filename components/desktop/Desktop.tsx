"use client";

import { useEffect, useReducer, useState } from "react";
import { DesktopIcon } from "@/components/chrome/DesktopIcon";
import { DocGlyph, FolderGlyph } from "@/components/chrome/glyphs";
import { MenuBar } from "@/components/chrome/MenuBar";
import { WindowFrame } from "@/components/chrome/WindowFrame";
import { Sky } from "@/components/sky/Sky";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AboutWindow } from "@/components/windows/AboutWindow";
import { ProjectWindow } from "@/components/windows/ProjectWindow";
import { WelcomeWindow } from "@/components/windows/WelcomeWindow";
import { WindowContentBoundary } from "@/components/windows/WindowContentBoundary";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { desktopReducer, initialDesktopState } from "./desktopReducer";
import { useIconDrag } from "./useIconDrag";
import { useMarquee } from "./useMarquee";
import { useIsMobile } from "./useIsMobile";
import type { ReactNode } from "react";
import type { Size, Viewport, WindowKind, WindowState } from "./types";

/**
 * Wraps an icon in its own context menu.
 *
 * Actions apply to the whole selection when the right-clicked icon belongs to
 * it, and to that icon alone otherwise — the same rule useIconDrag uses to
 * decide what a drag carries, and the one every file manager follows. Acting
 * only on the clicked icon would silently throw away a batch selection the
 * user had just made.
 *
 * Opening the menu on an unselected icon also reduces the selection to it, so
 * the highlight on screen always matches what the menu is about to act on.
 *
 * `display: contents` on the trigger is load-bearing: the icon button must stay
 * the direct flex child of the icon column, and it is also the element that
 * carries `data-icon` and gets pinned by useIconDrag. A trigger with a real box
 * would sit between them and break both the layout and the drag.
 */
function IconContextMenu({
  iconId,
  label,
  selected,
  onSelectOnly,
  onOpenIcons,
  onTidy,
  tidyDisabled,
  children,
}: {
  iconId: string;
  label: string;
  selected: ReadonlySet<string>;
  onSelectOnly: (id: string) => void;
  onOpenIcons: (ids: readonly string[]) => void;
  onTidy: () => void;
  tidyDisabled: boolean;
  children: ReactNode;
}) {
  const targets = selected.has(iconId) ? [...selected] : [iconId];
  const many = targets.length > 1;

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (open && !selected.has(iconId)) onSelectOnly(iconId);
      }}
    >
      <ContextMenuTrigger className="contents">{children}</ContextMenuTrigger>
      <ContextMenuContent
        aria-label={many ? `${targets.length} selected items` : `${label} actions`}
      >
        <ContextMenuGroup>
          <ContextMenuItem onClick={() => onOpenIcons(targets)}>
            {many ? `Open ${targets.length} Items` : "Open"}
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem disabled={tidyDisabled} onClick={onTidy}>
            Tidy Icons
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const SIZES: Record<WindowKind, Size> = {
  welcome: { w: 400, h: 320 },
  about: { w: 380, h: 300 },
  // Tall enough to clear a 16:9 hero image and still land on the first
  // paragraph. Every project in content/projects.ts now opens with one, and at
  // the old 380 the window filled with picture and the copy began below the
  // fold — a card you have to scroll before it says anything.
  project: { w: 480, h: 520 },
};

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function Desktop() {
  const [state, dispatch] = useReducer(desktopReducer, undefined, initialDesktopState);
  const isMobile = useIsMobile();
  const [iconEls] = useState(() => new Map<string, HTMLButtonElement>());
  const { selected, marqueeRef, onBackgroundPointerDown, selectOnly } =
    useMarquee(!isMobile, iconEls);
  const { positionOf, onIconPointerDown, isArranged, resetLayout } = useIconDrag(
    !isMobile,
    iconEls,
    selected,
  );

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

  // "welcome" is the one icon that is not a project; everything else on the
  // desktop maps to a project window.
  const openIcon = (id: string) =>
    id === "welcome" ? open("welcome") : open("project", id);

  /**
   * Each OPEN is a separate dispatch, so the reducer sees the growing window
   * count and cascades the new windows apart instead of stacking them.
   */
  const openIcons = (ids: readonly string[]) => ids.forEach(openIcon);

  const openWelcome = () => {
    selectOnly("welcome");
    open("welcome");
  };

  const registerIcon = (id: string) => (el: HTMLButtonElement | null) => {
    if (el) iconEls.set(id, el);
    else iconEls.delete(id);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      onPointerDown={onBackgroundPointerDown}
    >
      <h1 className="sr-only">{site.name}</h1>
      {/* The trigger wraps only the backdrop, not the whole desktop. Windows
          and icons paint above it and are not descendants, so right-clicking
          window text still gets the browser's own copy/paste menu — taking
          that away to show a desktop menu would be hostile. */}
      <ContextMenu>
        <ContextMenuTrigger className="fixed inset-0" aria-label="Desktop">
          <Sky />
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="Desktop actions">
          <ContextMenuGroup>
            <ContextMenuItem
              disabled={state.order.length === 0}
              onClick={() => dispatch({ type: "CLEAN_UP", viewport: viewport() })}
            >
              Clean Up Windows
            </ContextMenuItem>
            <ContextMenuItem disabled={!isArranged} onClick={resetLayout}>
              Tidy Icons
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem
              disabled={state.order.length === 0}
              onClick={() => dispatch({ type: "CLOSE_ALL" })}
            >
              Close All Windows
            </ContextMenuItem>
            <ContextMenuItem onClick={() => open("about")}>
              About this site…
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
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
      {/* Icons are `position: fixed` once dragged (see useIconDrag), so they
          escape this box entirely; `pointer-events-none` keeps the now-empty
          container from intercepting marquee drags on the bare desktop. */}
      {/* `flex-wrap-reverse` + `content-start` so the rail fills the rightmost
          column first and spills into further columns leftward, the way a real
          desktop does. Plain `flex-wrap` also fits everything, but puts the
          first icon in the *left* column and the last against the edge, which
          reads as scrambled. The column is a fixed box
          (top-10 → bottom-3) inside an `overflow-hidden` desktop, so without
          wrapping the trailing icons are simply unreachable: seven icons at
          80px plus gaps need ~660px of viewport, which a landscape phone or a
          1024×600 panel does not have. */}
      <div className="pointer-events-none absolute bottom-3 right-3 top-10 flex flex-col flex-wrap-reverse content-start items-center gap-4 max-sm:relative max-sm:mt-10 max-sm:grid max-sm:grid-cols-3 max-sm:justify-items-center max-sm:px-4">
        {projects.map((project) => {
          const openProject = () => {
            selectOnly(project.id);
            open("project", project.id);
          };
          return (
            <IconContextMenu
              key={project.id}
              iconId={project.id}
              label={project.title}
              selected={selected}
              onSelectOnly={selectOnly}
              onOpenIcons={openIcons}
              onTidy={resetLayout}
              tidyDisabled={!isArranged}
            >
              <DesktopIcon
                iconId={project.id}
                label={project.title}
                glyph={<FolderGlyph />}
                selected={selected.has(project.id)}
                iconRef={registerIcon(project.id)}
                style={positionOf(project.id)}
                onPointerDown={onIconPointerDown(project.id)}
                onOpen={openProject}
              />
            </IconContextMenu>
          );
        })}
        <IconContextMenu
          iconId="welcome"
          label={site.welcome.title}
          selected={selected}
          onSelectOnly={selectOnly}
          onOpenIcons={openIcons}
          onTidy={resetLayout}
          tidyDisabled={!isArranged}
        >
          <DesktopIcon
            iconId="welcome"
            label={site.welcome.title}
            glyph={<DocGlyph />}
            selected={selected.has("welcome")}
            iconRef={registerIcon("welcome")}
            style={positionOf("welcome")}
            onPointerDown={onIconPointerDown("welcome")}
            onOpen={openWelcome}
          />
        </IconContextMenu>
      </div>
      {/* Rubber-band rectangle: painted above icons (DOM order), below
          windows (their explicit z-index); driven by useMarquee. */}
      <div
        ref={marqueeRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 hidden border border-select bg-select/20"
      />
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
