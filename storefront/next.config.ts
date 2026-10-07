import type { NextConfig } from "next";

const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

// DEMO_STATIC=1 builds a plain static site (no server) for free hosts like Netlify Drop.
const demoStatic = process.env.DEMO_STATIC === "1";

const nextConfig: NextConfig = {
  output: demoStatic ? "export" : "standalone",
  trailingSlash: demoStatic,
  poweredByHeader: false,
  images: {
    // product photos uploaded in the admin are served by the backend
    remotePatterns: backend ? [{ protocol: new URL(backend).protocol.replace(":", "") as "http" | "https", hostname: new URL(backend).hostname }] : [],
  },
  ...(demoStatic ? {} : { headers }),
};

async function headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.stripe.com\")" },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
}

export default nextConfig;
