import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kp-background">
      <Sidebar />
      <TopNav />
      <main className="ml-64 pt-16 h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
