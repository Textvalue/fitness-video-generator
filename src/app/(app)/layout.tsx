import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kp-background">
      <Sidebar />
      <TopNav />
      <main className="ml-64 pt-16 pb-12 min-h-screen">{children}</main>
      <Footer />
    </div>
  );
}
