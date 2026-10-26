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
  title: "Java Fullstack & Architecture Notes",
  tagline: "Java, Spring Boot, React, Next.js, System Design & Software Mastery",
  description: "A comprehensive developer-focused knowledge base covering Java Fullstack, Spring Boot, React, Next.js, Distributed Software Architecture, Engineering Books, Roadmaps, and Complete Technical Mastery.",
  author: {
    name: "Mahendra S H",
    role: "Fullstack Engineer",
    bio: "Writing in-depth technical notes on Java fullstack systems, Spring Boot, React, Next.js, distributed architectures, engineering books, and complete developer roadmaps.",
    portfolioUrl: "https://mahendrash.vercel.app/",
    contactUrl: "https://mahendrash.vercel.app/contact",
    githubUrl: "https://github.com/MahendraSH/java-maahi-notes",
    linkedinUrl: "https://mahendrash.vercel.app/",
  },
  navigation: [
    { label: "Notes", href: "/#notes" },
    { label: "Topics", href: "/#topics" },
    { label: "How to Use", href: "/#how-to-use" },
    { label: "AI Copilot", href: "/llms" },
  ],
};
