import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vibe-notes/ui", "@vibe-notes/notes-core"],
  // Allow LAN access from local network without WebSocket warnings
  allowedDevOrigins: ["192.168.29.246", "localhost", "127.0.0.1"],
};

export default nextConfig;
