import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
} from "@playwright/test";

type BrowserProject = NonNullable<PlaywrightTestConfig["projects"]>[number];

const browserProjects: BrowserProject[] = [
  {
    // Chromium covers Chrome, Edge, and other Chromium-based desktop browsers.
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
  {
    // Firefox uses its own browser engine and often exposes CSS differences.
    name: "firefox",
    use: { ...devices["Desktop Firefox"] },
  },
];

if (process.env.PLAYWRIGHT_WEBKIT === "1") {
  browserProjects.push({
    // WebKit is the closest Playwright coverage available for Safari behavior.
    name: "webkit",
    use: { ...devices["Desktop Safari"] },
  });
}

export default defineConfig({
  // Browser tests live separately from Jest's unit tests.
  testDir: "./tests/e2e",
  // Each test has its own browser context, including tests in the same file.
  fullyParallel: true,
  // Allow multi-step tests to finish while Chromium and Firefox run in parallel.
  timeout: 30_000,
  use: {
    // Keep the deployed GitHub Pages base on a dedicated test server.
    baseURL: "http://127.0.0.1:4173",
  },
  projects: browserProjects,
  webServer: {
    // Always build fresh bundles; never test a stale build or a dev server.
    command:
      "npx vite build --mode e2e && npx vite preview --mode e2e --host 127.0.0.1 --port 4173 --strictPort --open false",
    url: "http://127.0.0.1:4173/tabui/",
    reuseExistingServer: false,
  },
});
