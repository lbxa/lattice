import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const retroButtonClass =
  "inline-flex items-center justify-center font-pixel text-[13px] leading-none " +
  "px-3 py-1.5 bg-chrome text-chrome-ink border border-outline rounded-[2px] bevel-out " +
  "select-none active:bevel-in active:bg-chrome-dark disabled:opacity-40 " +
  "focus-visible:outline-2 focus-visible:outline-select no-underline";

export function RetroButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`${retroButtonClass} ${className}`} />;
}

export function RetroLink({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={`${retroButtonClass} ${className}`} />;
}
