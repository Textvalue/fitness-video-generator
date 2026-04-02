"use client";

export function TopNav() {
  return (
    <header className="fixed top-0 right-0 h-16 bg-kp-background/80 backdrop-blur-md flex items-center w-[calc(100%-16rem)] px-8 z-30">
      <span className="text-lg font-black text-kp-primary-container font-headline uppercase tracking-widest">
        Kinetic Lab
      </span>
    </header>
  );
}
