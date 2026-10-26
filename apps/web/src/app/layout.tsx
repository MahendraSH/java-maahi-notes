import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/site.config";
import { SiteHeader } from "@/components/site-header";
import { DisclaimerBanner } from "@vibe-notes/ui";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  icons: {
    icon: "/icon.svg",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col justify-between">
        <DisclaimerBanner />
        {/* Responsive Site Header */}
        <SiteHeader />

        <main className="flex-1">{children}</main>

        {/* Site Footer */}
        <footer className="border-t border-border bg-card/40 mt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
              <div className="space-y-3 md:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#111317] border border-border flex items-center justify-center p-0.5">
                    <svg viewBox="0 0 64 64" className="w-full h-full">
                      <path d="M26 15c2-3 5-3 5 0s-3 3-1 6" fill="none" stroke="#E76F00" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M34 13c2.5-3 6-3 6 0s-3.5 3-1.5 6" fill="none" stroke="#F89820" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M19 28h22c0 9-4.5 15-11 15s-11-6-11-15z" fill="#F3F4F6"/>
                      <path d="M41 31h4a5 5 0 0 1 0 10h-5" fill="none" stroke="#F3F4F6" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M16 48c7 3 21 3 28 0" fill="none" stroke="#5382A1" strokeWidth="3.5" strokeLinecap="round"/>
                      <circle cx="49" cy="48" r="3.5" fill="#E76F00"/>
                    </svg>
                  </div>
                  <span className="font-bold text-sm text-foreground">{siteConfig.title}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {siteConfig.description}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                    Static & Fast
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    SSG
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3">Navigation</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="/#notes" className="hover:text-foreground transition-colors">Browse Notes</a></li>
                  <li><a href="/#how-to-use" className="hover:text-foreground transition-colors">How to Use</a></li>
                  <li><a href="/llms" className="hover:text-primary transition-colors font-medium text-foreground">AI Copilot & Prompts</a></li>
                  <li><a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">/llms.txt</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3">Reader Features</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><span className="text-foreground/80">Plain Text (Screen Readers)</span></li>
                  <li><span className="text-foreground/80">Semantic HTML Export</span></li>
                  <li><span className="text-foreground/80">Print / PDF Layout</span></li>
                  <li><span className="text-foreground/80">Raw Markdown (.md)</span></li>
                  <li><span className="text-foreground/80">Instant Fuzzy Search</span></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3">Author & Connect</h4>
                <ul className="space-y-2 text-muted-foreground">
                  {siteConfig.author.portfolioUrl && (
                    <li>
                      <a href={siteConfig.author.portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-medium text-foreground flex items-center gap-1">
                        <span>{siteConfig.author.name}</span>
                        <span className="text-[10px] text-primary">↗</span>
                      </a>
                    </li>
                  )}
                  {siteConfig.author.contactUrl && (
                    <li>
                      <a href={siteConfig.author.contactUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                        Contact / Inquiries
                      </a>
                    </li>
                  )}
                  {siteConfig.author.githubUrl && (
                    <li>
                      <a href={siteConfig.author.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                        GitHub
                      </a>
                    </li>
                  )}
                  {siteConfig.author.linkedinUrl && (
                    <li>
                      <a href={siteConfig.author.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                        LinkedIn
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>
                © {new Date().getFullYear()} {siteConfig.author.name || "Engineering Notes"}.
              </p>
              <div className="flex items-center gap-4">
                <a href="/#how-to-use" className="hover:text-foreground transition-colors">Reader Guide</a>
                {siteConfig.author.githubUrl && (
                  <a href={siteConfig.author.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Source Code</a>
                )}
                {siteConfig.author.contactUrl && (
                  <a href={siteConfig.author.contactUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Get in Touch</a>
                )}
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
