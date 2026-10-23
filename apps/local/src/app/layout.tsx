import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe Notes — Local Editor",
  description:
    "A local-first, developer-focused knowledge workspace for Markdown notes, technical learning, code snippets, and interview preparation.",
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
      <body className="antialiased min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
