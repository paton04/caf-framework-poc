"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/caf-data/types";

const INTERNAL_NAV = [
  { href: "/", label: "Overview" },
  { href: "/scope", label: "Scope Register" },
  { href: "/evidence", label: "Evidence Library" },
  { href: "/suppliers", label: "Suppliers" },
];

const SUPPLIER_NAV = [{ href: "/", label: "Your Indicators" }];

// No role assigned yet — deliberately minimal, not the full internal nav.
const UNASSIGNED_NAV = [{ href: "/", label: "Overview" }];

export function Sidebar({ role }: { role: UserRole | null }) {
  const pathname = usePathname();
  const navItems =
    role === "owner_admin"
      ? [...INTERNAL_NAV, { href: "/admin", label: "Admin" }]
      : role === "contributor"
        ? INTERNAL_NAV
        : role === "supplier"
          ? SUPPLIER_NAV
          : UNASSIGNED_NAV;

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
