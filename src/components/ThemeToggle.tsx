"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

// Mirrors the inline script in app/layout.tsx (same localStorage key,
// same logic) so the button's label matches whatever's already on
// <html> rather than guessing light on first render.
function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("caf-theme", next);
    } catch {
      // Private browsing etc. — the toggle still works for this page
      // load, it just won't be remembered next time.
    }
  }

  return (
    <button
      type="button"
      className="link-btn"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
