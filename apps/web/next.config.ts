import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vibe-notes/ui", "@vibe-notes/notes-core"],
};

export default nextConfig;
