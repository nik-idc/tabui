import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: path.resolve(__dirname, "src/index.ts"),
        styles: path.resolve(__dirname, "src/styles.ts"),
      },
      cssFileName: "styles",
      fileName: (_format, entryName) => `${entryName}.mjs`,
      formats: ["es"],
    },
    outDir: path.resolve(__dirname, "dist"),
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === "style.css" ? "styles.css" : "[name][extname]",
      },
    },
    sourcemap: true,
  },
});
