"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type icons } from "./ui";
import { useDemo } from "@/features/demo/provider";
const links: { href: string; label: string; icon: keyof typeof icons }[] = [
  { href: "/overview", label: "Overview", icon: "dashboard" },
  { href: "/records", label: "My records", icon: "records" },
  { href: "/goals", label: "Goals", icon: "goals" },
  { href: "/challenges", label: "Challenges", icon: "challenges" },
  { href: "/community", label: "Community", icon: "community" },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { household } = useDemo();
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
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <Icon name="shield" />
            <strong>Your progress. Your choice.</strong>
            <p>Your household records are private by default.</p>
            <Link href="/settings" onClick={() => setOpen(false)}>
              Explore privacy settings <Icon name="arrow" size={15} />
            </Link>
          </div>
          <Link
            href="/settings"
            className={`nav-link ${pathname === "/settings" ? "active" : ""}`}
            aria-current={pathname === "/settings" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <Icon name="settings" />
            Settings & privacy
          </Link>
          <div className="sidebar-footer">Small steps. Shared future.</div>
        </div>
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
              {links.find((l) => l.href === pathname)?.label ||
                "Settings & privacy"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span /> Demo mode
            </span>
            <span className="avatar">GG</span>
            <span className="household-name">{household}</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
          <footer className="page-footer">
            <span>Growing a more sustainable South Australia, together.</span>
            <span>Prototype · Sample data · No account required</span>
          </footer>
        </main>
      </div>
    </>
  );
}
