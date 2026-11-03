import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Assurance Register — CAF Self-Assessment (Trial)",
  description: "CAF/NIS compliance evidence tracking trial.",
};

// Runs before paint so a saved dark-mode choice doesn't flash light
// first — can't wait for React to hydrate for this one. Reads the same
// localStorage key ThemeToggle writes; no explicit choice yet means no
// attribute at all, which leaves the CSS's prefers-color-scheme media
// query in charge (see globals.css).
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem("caf-theme");
    if (t === "dark" || t === "light") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: themeInitScript sets data-theme on this
    // element before React hydrates, so it never matches what the
    // server rendered — an intentional, expected mismatch (that's the
    // whole point of running before paint), not a real bug to fix.
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
