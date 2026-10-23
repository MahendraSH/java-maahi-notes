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

import { SiteHeader } from "@/components/site-header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col justify-between">
        {/* Responsive Site Header */}
        <SiteHeader />

        <main className="flex-1">{children}</main>

        {/* Site Footer */}
        <footer className="border-t border-border bg-card/40 mt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
              <div className="space-y-3 md:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#17191C] border border-border flex items-center justify-center">
                    <svg viewBox="0 0 64 64" className="w-3.5 h-3.5">
                      <path d="M12 46V18h8.2L32 33.1 43.8 18H52v28h-9V31.2L32 43 21 31.2V46z" fill="#F3F4F6"/>
                      <circle cx="51" cy="49" r="4.5" fill="#F89820"/>
                    </svg>
                  </div>
                  <span className="font-bold text-sm text-foreground">Vibe Notes</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Open-source, local-first technical knowledge base & digital garden. Build your own notes system for any language or architecture.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                    MIT Licensed
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    v1.0
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3">Workspace</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="/#notes" className="hover:text-foreground transition-colors">Browse Notes</a></li>
                  <li><a href="/#features" className="hover:text-foreground transition-colors">Feature Highlights</a></li>
                  <li><a href="/setup" className="hover:text-primary transition-colors font-medium">Docs & Setup Guide</a></li>
                  <li><a href="/#demos" className="hover:text-foreground transition-colors">Interactive Demos</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3">Formats & Export</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><span className="text-foreground/80">Plain Text (Screen Readers)</span></li>
                  <li><span className="text-foreground/80">Semantic HTML Export</span></li>
                  <li><span className="text-foreground/80">Print / PDF Layout</span></li>
                  <li><span className="text-foreground/80">Raw Markdown (.md)</span></li>
                  <li><a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">/llms.txt (AI Prompts)</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3">Creator & Connect</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <a href="https://mahendrash.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-medium text-foreground flex items-center gap-1">
                      <span>Mahendra S H</span>
                      <span className="text-[10px] text-primary">↗</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://mahendrash.vercel.app/contact" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      Contact / Inquiries
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/MahendraSH/vibe-note" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      GitHub (vibe-note)
                    </a>
                  </li>
                  <li>
                    <a href="https://www.linkedin.com/in/mahendra-s-h-14a74721a/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a href="mailto:mahendrashongunti@gmail.com" className="hover:text-foreground transition-colors">
                      Email Mahendra
                    </a>
                  </li>
                  <li>
                    <a href="https://www.upwork.com/freelancers/~015e4bc8c81692a6f2" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      Upwork
                    </a>
                  </li>
                  <li>
                    <a href="https://contra.com/mahendra_s_h_r9rbbb9o" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      Contra
                    </a>
                  </li>
                  <li>
                    <a href="https://medium.com/@maahi2001sh" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      Medium
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>
                © {new Date().getFullYear()} <a href="https://mahendrash.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary font-medium">Mahendra S H</a>. Open Source under the <a href="https://github.com/MahendraSH/vibe-note/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">MIT License</a>.
              </p>
              <div className="flex items-center gap-4">
                <a href="/setup" className="hover:text-foreground transition-colors">Documentation</a>
                <a href="https://github.com/MahendraSH/vibe-note" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Source Code</a>
                <a href="https://mahendrash.vercel.app/contact" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Get in Touch</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
