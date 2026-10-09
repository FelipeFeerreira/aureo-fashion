import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: process.env.CLOUDINARY_CLOUD_NAME
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/**`,
          },
        ]
      : [],
  },
  async headers() {
    const headers = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      { source: "/admin/:path*", headers },
      { source: "/api/admin/:path*", headers },
    ];
  },
};

export default nextConfig;
