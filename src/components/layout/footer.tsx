"use client";

export function Footer() {
  return (
    <footer className="fixed bottom-0 right-0 w-[calc(100%-16rem)] h-8 bg-kp-surface-container-low flex justify-between items-center px-6 py-1 z-50 font-sans text-[10px] uppercase tracking-widest text-kp-secondary">
      <div className="flex gap-6">
        <span className="text-kp-on-surface-variant">
          Status: <span className="text-kp-secondary">Online</span>
        </span>
        <span className="text-kp-on-surface-variant">API Latency: 45ms</span>
      </div>
      <div className="text-kp-on-surface-variant">
        &copy; 2024 Kinetic Precision Lab
      </div>
    </footer>
  );
}
