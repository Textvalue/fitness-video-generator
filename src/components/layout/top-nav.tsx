"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const topNavLinks = [
  { label: "Projects", href: "/" },
  { label: "Models", href: "/pipeline" },
  { label: "Assets", href: "/library" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 right-0 h-16 bg-kp-background/80 backdrop-blur-md flex justify-between items-center w-[calc(100%-16rem)] px-8 z-30">
      <div className="flex items-center gap-8">
        <span className="text-lg font-black text-kp-primary-container font-headline uppercase tracking-widest">
          Kinetic Lab
        </span>
        <nav className="hidden md:flex gap-6">
          {topNavLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-headline uppercase text-xs tracking-widest transition-all ${
                  isActive
                    ? "text-kp-primary-container border-b-2 border-kp-primary-container pb-1"
                    : "text-kp-on-surface-variant hover:text-kp-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative flex items-center bg-kp-surface-container-low px-4 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-sm text-kp-on-surface-variant mr-2">
            search
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-[10px] text-kp-on-surface placeholder:text-kp-on-surface-variant/50 tracking-widest w-48 font-sans"
            placeholder="SEARCH ASSETS..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-4 text-kp-primary">
          <button className="relative hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-kp-secondary rounded-full" />
          </button>
          <button className="hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
          <Link
            href="/pipeline"
            className="bg-kp-primary text-kp-on-primary px-6 py-1.5 rounded-full font-headline font-bold text-xs uppercase tracking-tighter hover:bg-kp-primary-dim transition-colors"
          >
            Render
          </Link>
        </div>
      </div>
    </header>
  );
}
