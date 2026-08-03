import { Score, serializeScore } from "../../src/notation/model";
import { bindScorePersistenceControls } from "../../demo/score-persistence-controls";
import {
  dispatchClick,
  dispatchEvent,
  FakeElement,
  makeButton,
  makeInput,
  makeText,
} from "../callbacks/helpers";

function createControls() {
  const serializeButton = makeButton() as unknown as HTMLButtonElement &
    FakeElement;
  const deserializeButton = makeButton() as unknown as HTMLButtonElement &
    FakeElement;
  const fileInput = makeInput() as unknown as HTMLInputElement & FakeElement;
  Object.assign(fileInput, { click: jest.fn(), files: null });
  const status = makeText() as unknown as HTMLElement & FakeElement;
  return { serializeButton, deserializeButton, fileInput, status };
}

function selectFile(
  fileInput: HTMLInputElement & FakeElement,
  name: string,
  contents: string
): void {
  Object.defineProperty(fileInput, "files", {
    configurable: true,
    value: [{ name, text: async () => contents }],
  });
  dispatchEvent(fileInput, "change");
}

describe("demo score persistence controls", () => {
  test("downloads the current score as formatted JSON", () => {
    const controls = createControls();
    const score = new Score([], "Current score", "Artist", "Song");
    const downloadDocument = jest.fn<void, [string, string]>();
    const unbind = bindScorePersistenceControls({
      ...controls,
      getScore: () => score,
      replaceScore: jest.fn(),
      downloadDocument,
    });

    dispatchClick(controls.serializeButton);

    expect(downloadDocument).toHaveBeenCalledTimes(1);
    const [contents, filename] = downloadDocument.mock.calls[0];
    const document = JSON.parse(contents) as {
      name: string;
    };
    expect(document.name).toBe("Current score");
    expect(filename).toBe("current-score.tabui.json");
    expect(controls.status.dataset.state).toBe("success");
    unbind();
  });

  test("opens a picker and replaces the score from the selected file", async () => {
    const controls = createControls();
    const source = new Score([], "Source", "Artist", "Song");
    const replaceScore = jest.fn<void, [Score]>();
    bindScorePersistenceControls({
      ...controls,
      getScore: () => source,
      replaceScore,
      downloadDocument: jest.fn(),
    });

    dispatchClick(controls.deserializeButton);
    expect(controls.fileInput.click).toHaveBeenCalledTimes(1);
    const document = serializeScore(source);
    document.name = "Restored from file";
    selectFile(
      controls.fileInput,
      "restored.tabui.json",
      JSON.stringify(document)
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(replaceScore).toHaveBeenCalledTimes(1);
    expect(replaceScore.mock.calls[0][0]).not.toBe(source);
    expect(replaceScore.mock.calls[0][0].name).toBe("Restored from file");
    expect(controls.status.dataset.state).toBe("success");
  });

  test("keeps the mounted score when the selected file is invalid", async () => {
    const controls = createControls();
    const replaceScore = jest.fn<void, [Score]>();
    bindScorePersistenceControls({
      ...controls,
      getScore: () => new Score(),
      replaceScore,
      downloadDocument: jest.fn(),
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    selectFile(controls.fileInput, "broken.json", "{invalid");
    await Promise.resolve();
    await Promise.resolve();

    expect(replaceScore).not.toHaveBeenCalled();
    expect(controls.status.dataset.state).toBe("error");
    consoleError.mockRestore();
  });
});
