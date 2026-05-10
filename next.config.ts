import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Avoid picking up a parent folder lockfile (e.g. C:\Users\you\package-lock.json) as Turbopack root
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
