"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/" },
  { icon: "psychology", label: "Trainers", href: "/trainers" },
  { icon: "fitness_center", label: "Library", href: "/library" },
  { icon: "settings_input_component", label: "Pipeline", href: "/pipeline" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-kp-surface-container-low z-40 font-headline tracking-tight">
      <div className="p-8">
        <div className="text-2xl font-bold tracking-tighter text-kp-primary">
          AI Trainer
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-kp-on-surface-variant mt-1">
          Precision Lab
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "text-kp-primary font-bold border-r-4 border-kp-primary-container bg-kp-surface-container-high"
                  : "text-kp-on-surface-variant hover:text-kp-on-surface hover:bg-kp-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-8 mb-8">
        <Link
          href="/pipeline"
          className="w-full py-4 rounded-full bg-gradient-to-r from-kp-primary to-kp-secondary text-kp-on-primary font-bold text-sm tracking-wide transform active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          New Generation
        </Link>
      </div>

      <div className="p-4 space-y-1 mb-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2 text-xs text-kp-on-surface-variant hover:text-kp-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">settings</span>
          Settings
        </Link>
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2 text-xs text-kp-on-surface-variant hover:text-kp-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">help</span>
          Support
        </a>
      </div>
    </aside>
  );
}
