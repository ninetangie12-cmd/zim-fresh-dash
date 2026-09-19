// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

const apiDevPlugin: Plugin = {
  name: "auth-address-api-dev-server",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith("/api/")) {
        try {
          const { handleNodeApiRequest } = await import("./src/server/api-router");
          const handled = await handleNodeApiRequest(req, res);
          if (handled) return;
        } catch (err) {
          console.error("API dev middleware error:", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Internal Server Error" }));
          return;
        }
      }
      next();
    });
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [apiDevPlugin],
  },
});
