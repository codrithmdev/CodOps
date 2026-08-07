import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // Order matters: tanstackStart must come before the other plugins.
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // Nitro/vite builds from this.
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    // Provides the "@/*" path alias from tsconfig.json.
    tsConfigPaths(),
  ],
});
