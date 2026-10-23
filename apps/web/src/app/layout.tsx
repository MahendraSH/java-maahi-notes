import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe Notes — Knowledge Base",
  description:
    "A curated collection of developer knowledge notes on Java, Spring Boot, system design, and fullstack engineering.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {/* Site Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
            <a href="/" className="flex items-center gap-2.5 group" aria-label="Vibe Notes home">
              <div className="w-8 h-8 rounded-lg bg-[#17191C] flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 64 64" className="w-5 h-5">
                  <path d="M12 46V18h8.2L32 33.1 43.8 18H52v28h-9V31.2L32 43 21 31.2V46z" fill="#F3F4F6"/>
                  <circle cx="51" cy="49" r="4.5" fill="#F89820"/>
                </svg>
              </div>
              <span className="font-semibold text-foreground text-sm tracking-wide">Vibe Notes</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Knowledge Base</span>
            </a>
          </div>
        </header>

        <main className="min-h-[calc(100vh-140px)]">{children}</main>

        {/* Site Footer */}
        <footer className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
            <p>Vibe Notes — Developer Knowledge Base</p>
            <p>Built with Next.js</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
