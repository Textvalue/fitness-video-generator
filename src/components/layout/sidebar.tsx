"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "fitness_center", label: "Exercises", href: "/" },
  { icon: "person", label: "Trainers", href: "/trainers" },
  { icon: "landscape", label: "Environments", href: "/environments" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-kp-surface-container-low z-40 font-headline tracking-tight">
      <div className="p-8">
        <Link href="/">
          <div className="text-2xl font-bold tracking-tighter text-kp-primary">
            AI Trainer
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-kp-on-surface-variant mt-1">
            Precision Lab
          </div>
        </Link>
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

      <div className="p-6 text-[10px] text-kp-on-surface-variant/50 uppercase tracking-widest">
        &copy; 2024 Kinetic Precision Lab
      </div>
    </aside>
  );
}
