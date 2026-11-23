import { defineConfig } from "vite";

export default defineConfig({
  build: { outDir: "docs/api" },
  preview: { host: "127.0.0.1", port: 5177, strictPort: true },
});
