"use client";

import { Component, type ReactNode } from "react";

type BoundaryState = { failed: boolean };

/** One broken window app must not take down the desktop. */
export class WindowContentBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="p-4 font-pixel text-[13px]">
          This window crashed. Close it and carry on.
        </p>
      );
    }
    return this.props.children;
  }
}
