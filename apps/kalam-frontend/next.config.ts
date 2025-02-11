import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pin.it",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
    ],
  },
};

export default nextConfig;
