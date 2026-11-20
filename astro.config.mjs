import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://newhot.org",
  output: "static",
  trailingSlash: "always",
  build: { format: "directory" },
  publicDir: "./public",
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
