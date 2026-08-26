import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The desktop is fully statically prerendered; export it as plain assets
  // so it deploys to Cloudflare Workers Static Assets (see wrangler.jsonc)
  // with no server runtime.
  output: "export",
  // Required under `output: "export"`; project images ship unoptimized.
  images: { unoptimized: true },
};

export default nextConfig;
