import { defineConfig } from "vite";
import path from "path";

export default defineConfig(({ command }) => ({
  root: path.resolve(__dirname, "demo/raw"),
  publicDir: path.resolve(__dirname, "assets"),
  base: "/tabui/",
  build: {
    outDir: path.resolve(__dirname, "demo/dist"),
    emptyOutDir: true,
  },
  resolve: {
    // Source aliases keep local hot reload; builds use the public package exports.
    alias:
      command === "serve"
        ? [
            {
              find: "@atikincode/tabui/styles.css",
              replacement: path.resolve(__dirname, "src/styles.scss"),
            },
            {
              find: /^@atikincode\/tabui$/,
              replacement: path.resolve(__dirname, "src/index.ts"),
            },
          ]
        : [],
  },
  server: {
    open: true,
  },
}));
