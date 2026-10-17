import type { NextConfig } from "next";

// Runs as a Node server (`npm run build && npm start`). Responses and photos
// are stored under DATA_DIR; see lib/server/db.ts.
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
