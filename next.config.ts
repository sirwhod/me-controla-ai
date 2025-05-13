import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
    {
      protocol: "https",
      hostname: "upload.wikimedia.org",
      pathname: "/wikipedia/commons/**"
    },
    {
      protocol: "https",
      hostname: "google.com",
      pathname: "/url?**"
    },
  ]
  }
};

export default nextConfig;
