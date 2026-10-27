import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { expect } from "@playwright/test";

/** Smoke-tests sound-source controls against the installed-package showcase. */
export async function checkSoundSources(page, origin) {
  const base = `${origin}/tabui/showcase/`;
  const select = page.locator("#sound-source-select");
  await page.goto(`${base}?soundSource=synths`, { timeout: 15_000 });
  await expect(select).toHaveValue("synths");
  await expect(select.locator("option")).toHaveText([
    "FluidR3",
    "Free Wave Samples",
    "Synth",
  ]);
  const requestedSamples = [];
  const onRequest = (request) => {
    if (request.url().endsWith(".wav")) {
      requestedSamples.push(request.url());
    }
  };
  page.on("request", onRequest);
  try {
    await page
      .getByRole("textbox", { name: "Score name", exact: true })
      .fill("Sound source smoke test");
    const before = await downloadScore(page);
    assert.equal(before.name, "Sound source smoke test");
    await select.selectOption("fluidr3");
    await expect(page).toHaveURL(/soundSource=fluidr3/);
    await expect(page.locator("#tabui-editor .tu-root-svg")).toHaveCount(1);
    assert.deepEqual(await downloadScore(page), before);
    await page.reload();
    await expect(select).toHaveValue("fluidr3");

    await select.selectOption("synths");
    const sampleCount = requestedSamples.length;
    await page.reload();
    await expect(select).toHaveValue("synths");
    await expect(page.locator("#tabui-editor .tu-root-svg")).toHaveCount(1);
    assert.equal(requestedSamples.length, sampleCount);
    await page.goto(`${base}?soundSource=samples`, { timeout: 15_000 });
    await expect(select).toHaveValue("samples");
    await page.goto(`${base}?soundSource=unknown`, { timeout: 15_000 });
    await expect(select).toHaveValue("fluidr3");
    await page.goto(base, { timeout: 15_000 });
    await expect(select).toHaveValue("fluidr3");
    console.log("  showcase: sound-source controls and score retention passed");
  } finally {
    page.off("request", onRequest);
  }
}

/** Reads the public download action rather than accessing private editor state. */
async function downloadScore(page) {
  const pending = page.waitForEvent("download");
  await page.locator("#serialize-score").click();
  const download = await pending;
  const filename = await download.path();
  assert(filename !== null);
  return JSON.parse(await readFile(filename, "utf8"));
}
