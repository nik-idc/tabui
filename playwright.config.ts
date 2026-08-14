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
  // Browser tests live separately from Jest's unit and integration tests.
  testDir: "./tests/e2e",
  // Keep tests within each file sequential while this initial suite stays small.
  fullyParallel: false,
  // Fail a test when an expected browser action takes longer than ten seconds.
  timeout: 10_000,
  use: {
    // The local Vite server uses this path as its deployed GitHub Pages base.
    baseURL: "http://127.0.0.1:5173",
  },
  projects: browserProjects,
  webServer: {
    // Playwright starts Vite before tests and stops it after the run.
    command: "npx vite --host 127.0.0.1 --open false",
    url: "http://127.0.0.1:5173/tabui/",
    // Reuse a manually started local server, but never reuse one in CI.
    reuseExistingServer: !process.env.CI,
  },
});
