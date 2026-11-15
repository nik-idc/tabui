import { mountDemo } from "./demo-app";

const host = document.getElementById("demo");
if (host === null) {
  throw new Error("Could not get #demo element");
}

const unmount = mountDemo(host, {
  assetBaseUrl: import.meta.env.BASE_URL,
  shouldThemePage: true,
});

import.meta.hot?.dispose(unmount);
