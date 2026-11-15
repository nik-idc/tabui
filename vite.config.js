import { defineConfig } from "vite";
import path from "path";
import process from "process";

// The "site" mode builds the demo into the website under <site base>demo/.
const siteBase = process.env.TABUI_SITE_BASE ?? "/tabui/";
const outDirs = {
  e2e: "node_modules/.cache/tabui-e2e",
  site: "site/dist/demo",
};

export default defineConfig(({ command, mode }) => ({
  root: path.resolve(__dirname, "demo/raw"),
  publicDir: path.resolve(__dirname, "assets"),
  base: mode === "site" ? `${siteBase}demo/` : "/tabui/",
  build: {
    outDir: path.resolve(__dirname, outDirs[mode] ?? "demo/dist"),
    emptyOutDir: true,
    ...(mode === "e2e"
      ? {
          rollupOptions: {
            input: {
              demo: path.resolve(__dirname, "demo/raw/index.html"),
              fixture: path.resolve(__dirname, "tests/e2e/browser-fixture.ts"),
            },
            // Browser-side imports need the fixture entry's named exports.
            preserveEntrySignatures: "exports-only",
            output: {
              entryFileNames: (entry) =>
                entry.name === "fixture"
                  ? "e2e-fixture.js"
                  : "assets/[name]-[hash].js",
            },
          },
        }
      : {}),
  },
  resolve: {
    // E2e bundles current source without needing an existing package build.
    // Normal demo builds still check the public package exports.
    alias:
      command === "serve" || mode === "e2e"
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
