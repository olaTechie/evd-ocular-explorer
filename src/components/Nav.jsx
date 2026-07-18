"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  ["/", "Overview"],
  ["/studies/", "Studies"],
  ["/figures/", "Figures"],
  ["/references/", "References"],
  ["/about/", "About"],
];

function ThemeToggle() {
  const [theme, setTheme] = useState(null);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    setTheme(saved || "auto");
  }, []);
  const cycle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  };
  return (
    <button className="icon-btn" onClick={cycle} aria-label="Toggle colour theme" title="Toggle light / dark">
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

export default function Nav() {
  const path = usePathname();
  const isActive = (href) =>
    href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, ""));
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="dot" />
          <span>EVD Ocular Explorer <small>· evidence companion</small></span>
        </Link>
        <div className="nav-links">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={isActive(href) ? "active" : ""}>
              {label}
            </Link>
          ))}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
