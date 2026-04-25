import { Footer, TopNav } from "./_lib/ui";

export default function DemoBLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper font-sans text-ink min-h-screen selection:bg-accent/10 selection:text-accent-dark">
      <TopNav />
      {children}
      <Footer />
    </div>
  );
}
