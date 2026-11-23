/**
 * @jest-environment jsdom
 */
import { File } from "node:buffer";
import { setImmediate } from "node:timers";
import { Score } from "../../../src/notation/model";
import { exportMusicXml } from "../../../src/notation/format";
import { bindScoreExchangeControls } from "../../../demo/raw/score-exchange-controls";
import { createFeatureShowcaseScoreFixture } from "../../../fixtures/feature-showcase-score";

async function flushPromises(): Promise<void> {
  // Let File.text() and the async listener finish.
  await new Promise<void>((resolve) => setImmediate(resolve));
}

function mount(score: Score) {
  document.body.innerHTML = `
    <select><option value="musicxml">MusicXML</option></select>
    <button id="import">Import</button>
    <button id="export">Export</button>
    <input type="file" />
    <p></p>`;
  const replaceScore = jest.fn<void, [Score]>();
  const downloadDocument = jest.fn<void, [string, string, string]>();
  const fileInput = document.querySelector("input") as HTMLInputElement;
  const status = document.querySelector("p") as HTMLElement;
  const unbind = bindScoreExchangeControls({
    formatSelect: document.querySelector("select") as HTMLSelectElement,
    importButton: document.querySelector("#import") as HTMLButtonElement,
    exportButton: document.querySelector("#export") as HTMLButtonElement,
    fileInput,
    status,
    getScore: () => score,
    replaceScore,
    downloadDocument,
  });
  return { replaceScore, downloadDocument, fileInput, status, unbind };
}

function selectFile(fileInput: HTMLInputElement, file: File): void {
  // jsdom cannot open a file picker, so supply the chosen file directly.
  Object.defineProperty(fileInput, "files", {
    configurable: true,
    value: [file],
  });
  fileInput.dispatchEvent(new Event("change"));
}

describe("demo score exchange controls", () => {
  test("exports the score as a MusicXML file", () => {
    const score = createFeatureShowcaseScoreFixture();
    const controls = mount(score);

    (document.querySelector("#export") as HTMLButtonElement).click();

    expect(controls.downloadDocument).toHaveBeenCalledWith(
      exportMusicXml(score),
      "sample-song.musicxml",
      "application/vnd.recordare.musicxml+xml"
    );
    expect(controls.status.textContent).toBe(
      "Downloaded sample-song.musicxml."
    );
    controls.unbind();
  });

  test("imports a MusicXML file and replaces the score", async () => {
    const xml = exportMusicXml(createFeatureShowcaseScoreFixture());
    const controls = mount(new Score([], "Current", ""));

    selectFile(controls.fileInput, new File([xml], "song.musicxml"));
    await flushPromises();

    expect(controls.replaceScore).toHaveBeenCalledTimes(1);
    expect(controls.replaceScore.mock.calls[0][0].name).toBe("Sample song");
    expect(controls.status.textContent).toBe("Imported song.musicxml.");
    expect(controls.status.dataset.state).toBe("success");
    controls.unbind();
  });

  test("shows an error for a file it cannot import", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const controls = mount(new Score([], "Current", ""));

    selectFile(controls.fileInput, new File(["not xml"], "song.musicxml"));
    await flushPromises();

    expect(controls.replaceScore).not.toHaveBeenCalled();
    expect(controls.status.textContent).toBe("The file is not valid XML");
    expect(controls.status.dataset.state).toBe("error");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
    controls.unbind();
  });
});
