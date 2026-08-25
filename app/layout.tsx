import type { Metadata } from "next";
import { Geist, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const pixelChrome = Pixelify_Sans({
  variable: "--font-pixel-chrome",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lattice — Desktop",
  description:
    "A retro desktop portfolio: open the folders to explore projects.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${pixelChrome.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
