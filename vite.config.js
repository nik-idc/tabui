import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "test-editor",
  publicDir: false,
  build: {
    sourcemap: true,
    outDir: "public", // 🔁 formerly dist, now public
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "test-editor/index.html")
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
