import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lzumixprwbtxjchwjelc.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // Temporary: Allow placeholder hostname for existing data
      {
        protocol: "https",
        hostname: "your-project-ref.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
