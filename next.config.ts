import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { // ADICIONE ESTA ENTRADA
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**" 
      }
  ]
  }
};

export default nextConfig;
