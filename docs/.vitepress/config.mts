import { defineConfig } from "vitepress";

// The site, demo, and API reference share one base path. GitHub Pages serves
// them under /tabui/; a custom domain would set TABUI_SITE_BASE=/ instead.
const base = process.env.TABUI_SITE_BASE ?? "/tabui/";

export default defineConfig({
  title: "TabUI",
  description:
    "A framework-agnostic guitar tablature editor for the browser, written in TypeScript.",
  base,
  cleanUrls: true,
  outDir: "../site/dist",
  // The demo and API reference are built separately into the same site.
  ignoreDeadLinks: [/^\/(demo|api)\//],
  srcExclude: ["api/**", "api-introduction.md", "code-style.md", "playback.md"],
  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` },
    ],
  ],
  themeConfig: {
    nav: [
      { text: "Demo", link: "/demo/", target: "_self" },
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
});
