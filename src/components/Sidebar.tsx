"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/scope", label: "Scope Register" },
  { href: "/evidence", label: "Evidence Library" },
  { href: "/suppliers", label: "Suppliers" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="name">Assurance Register</div>
        <div className="tag">CAF / NIS Trial Build</div>
      </div>
      <nav className="nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "active" : ""}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="cycle-box">
        <div className="label">Current cycle</div>
        <div className="val">2026 / 27 — Live</div>
        <div className="label" style={{ marginTop: 10 }}>
          Data
        </div>
        <div className="val" style={{ fontSize: 11 }}>
          Dummy / anonymised
        </div>
      </div>
    </div>
  );
}
