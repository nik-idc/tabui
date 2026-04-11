import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "demo"),
  base: "/tabui/",
  build: {
    outDir: path.resolve(__dirname, "demo/dist"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    open: true,
  },
});
