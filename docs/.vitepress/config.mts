import { cpSync, createReadStream, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { defineConfig } from "vitepress";

// The site and API reference share one base path. GitHub Pages serves them
// under /tabui/; a custom domain would set TABUI_SITE_BASE=/ instead.
const base = process.env.TABUI_SITE_BASE ?? "/tabui/";

// The demo's audio samples live in assets/samples. The dev server serves them
// from there, and the build copies them, so the site needs no second copy.
const samplesDir = fileURLToPath(
  new URL("../../assets/samples", import.meta.url)
);

/** Serves assets/samples at <base>samples/ in the dev server. */
function serveDemoSamples(): Plugin {
  return {
    name: "tabui-demo-samples",
    configureServer(server) {
      server.middlewares.use(`${base}samples`, (req, res, next) => {
        const urlPath = decodeURIComponent((req.url ?? "").split("?")[0]);
        const file = path.join(samplesDir, urlPath);
        // Do not serve files outside the samples folder.
        if (!file.startsWith(samplesDir + path.sep)) {
          next();
          return;
        }
        try {
          if (!statSync(file).isFile()) {
            next();
            return;
          }
        } catch {
          next();
          return;
        }
        const isWav = file.endsWith(".wav");
        res.setHeader("Content-Type", isWav ? "audio/wav" : "text/plain");
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  title: "TabUI",
  description:
    "A framework-agnostic guitar tablature editor for the browser, written in TypeScript.",
  base,
  cleanUrls: true,
  outDir: "../site/dist",
  // The API reference is built separately into the same folder.
  ignoreDeadLinks: [/^\/api\//],
  srcExclude: ["api/**", "api-introduction.md", "code-style.md", "playback.md"],
  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` },
    ],
  ],
  themeConfig: {
    nav: [
      { text: "Demo", link: "/demo" },
      { text: "Guides", link: "/embedding" },
      { text: "API", link: "/api/", target: "_self" },
    ],
    sidebar: [
      {
        text: "Guides",
        items: [
          { text: "Embedding TabUI", link: "/embedding" },
          { text: "Keyboard shortcuts", link: "/keyboard-shortcuts" },
          { text: "Features", link: "/features" },
          { text: "Domain model and terms", link: "/domain" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/nik-idc/tabui" }],
    search: { provider: "local" },
  },
  buildEnd(siteConfig) {
    cpSync(samplesDir, path.join(siteConfig.outDir, "samples"), {
      recursive: true,
    });
  },
  vite: {
    plugins: [serveDemoSamples()],
    resolve: {
      // The demo page uses TabUI from source, like the raw demo's dev server.
      alias: [
        {
          find: "@atikincode/tabui/styles.css",
          replacement: fileURLToPath(
            new URL("../../src/styles.scss", import.meta.url)
          ),
        },
        {
          find: /^@atikincode\/tabui$/,
          replacement: fileURLToPath(
            new URL("../../src/index.ts", import.meta.url)
          ),
        },
      ],
    },
  },
});
