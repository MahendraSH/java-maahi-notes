export interface SiteConfig {
  title: string;
  tagline: string;
  description: string;
  author: {
    name: string;
    role?: string;
    bio: string;
    portfolioUrl?: string;
    contactUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  };
  navigation: Array<{
    label: string;
    href: string;
  }>;
}

export const siteConfig: SiteConfig = {
  title: "Engineering Notes",
  tagline: "Technical Notes, Architecture & Deep Dives",
  description: "A personal digital garden and engineering notebook covering software design, architectures, and implementation patterns.",
  author: {
    name: "Developer",
    role: "Software Engineer",
    bio: "Writing technical notes, software architecture deep dives, and production system design explorations.",
    portfolioUrl: "https://github.com",
    contactUrl: "https://github.com",
    githubUrl: "https://github.com",
  },
  navigation: [
    { label: "Notes", href: "/#notes" },
    { label: "Topics", href: "/#topics" },
    { label: "How to Use", href: "/#how-to-use" },
    { label: "AI Copilot", href: "/llms" },
  ],
};
