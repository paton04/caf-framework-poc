"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import type { UserRole } from "@/lib/caf-data/types";

const INTERNAL_NAV = [
  { href: "/", label: "Scope items" },
  { href: "/evidence", label: "Evidence" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/my-items", label: "My items" },
  { href: "/history", label: "History" },
];

const SUPPLIER_NAV = [{ href: "/", label: "Your indicators" }];

// GRC's whole job is reviewing evidence — no need for the doer-focused
// pages (scope register, my items, etc.).
const GRC_NAV = [
  { href: "/evidence", label: "Evidence" },
  { href: "/report", label: "Report" },
];

// No role assigned yet — deliberately minimal, not the full internal nav.
const UNASSIGNED_NAV = [{ href: "/", label: "Scope items" }];

const ROLE_LABEL: Record<UserRole, string> = {
  owner_admin: "Owner/Admin",
  contributor: "Contributor",
  supplier: "Supplier",
  grc: "GRC",
};

// "/" owns everything under /scope too — a scope item and its outcomes
// are drill-downs from the Scope items list, not pages of their own.
function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/scope/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav({ role, email }: { role: UserRole | null; email: string | null }) {
  const pathname = usePathname();
  const navItems =
    role === "owner_admin"
      ? [...INTERNAL_NAV, { href: "/report", label: "Report" }, { href: "/admin", label: "Admin" }]
      : role === "contributor"
        ? INTERNAL_NAV
        : role === "supplier"
          ? SUPPLIER_NAV
          : role === "grc"
            ? GRC_NAV
            : UNASSIGNED_NAV;

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <div className="topnav-brand">Assurance Register</div>
        <nav className="topnav-links" aria-label="Main">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="topnav-right">
          <span>Cycle 2026/27</span>
          <span title={email ?? undefined}>{role ? ROLE_LABEL[role] : "No role"}</span>
          <form action={signOut}>
            <button className="link-btn" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
