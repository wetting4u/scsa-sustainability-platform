"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type icons } from "./ui";

import { createClient } from "@/lib/supabase/client";
const links: { href: string; label: string; icon: keyof typeof icons }[] = [
  { href: "/overview", label: "Overview", icon: "dashboard" },
  { href: "/records", label: "My records", icon: "records" },
  { href: "/goals", label: "Goals", icon: "goals" },
  { href: "/challenges", label: "Challenges", icon: "challenges" },
  { href: "/community", label: "Community", icon: "community" },
  { href: "/settings", label: "Settings", icon: "settings" },
];
const adminLinks: {
  href: string;
  label: string;
  icon: keyof typeof icons;
}[] = [
  {
    href: "/admin",
    label: "Admin overview",
    icon: "dashboard",
  },
  {
    href: "/admin/users",
    label: "Manage users",
    icon: "community",
  },
  {
    href: "/admin/challenges",
    label: "Manage challenges",
    icon: "challenges",
  },
];
export function Shell({
  children,
  householdName,
  isAdmin,
}: {
  children: React.ReactNode;
  householdName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials =
  householdName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "MH";
  async function handleSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/sign-in";
}

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link className="brand" href="/overview" aria-label="SCSA home">
          <span className="brand-mark">
            <Icon name="sprout" size={29} />
          </span>
          <span>
            SCSA<small>SUSTAINABLE COMMUNITIES SA</small>
          </span>
        </Link>
        <div className="nav-label">YOUR HOUSEHOLD</div>
        <nav aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
            >
              <Icon name={l.icon} />
              {l.label}
              {pathname === l.href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        {isAdmin && (
          <>
            <div className="nav-label">ADMINISTRATION</div>

            <nav aria-label="Administrator navigation">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={
                    pathname === link.href ? "page" : undefined
                  }
                  className={`nav-link ${
                    pathname === link.href ? "active" : ""
                  }`}
                >
                  <Icon name={link.icon} />
                  {link.label}
                  {pathname === link.href && (
                    <span className="nav-dot" />
                  )}
                </Link>
              ))}
            </nav>
          </>
        )}
      </aside>
      <div className="app-body">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            Your space <span>/</span>{" "}
            <strong>
              {[...links, ...adminLinks].find(
              (link) => link.href === pathname,
            )?.label || "Settings & privacy"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="avatar">{initials}</span>
            <span className="household-name">{householdName}</span>
            <button
              type="button"
              className="button secondary"
              onClick={handleSignOut}
              style={{ padding: "8px 12px" }}
            >
              Sign out
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
          <footer className="page-footer">
            <span>Growing a more sustainable South Australia, together.</span>
            <span>Prototype · Sample sustainability data · Account protected</span>
          </footer>
        </main>
      </div>
    </>
  );
}
