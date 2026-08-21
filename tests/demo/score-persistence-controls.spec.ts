import { Score, serializeScore } from "../../src/notation/model";
import {
  bindScorePersistenceControls,
  downloadScoreDocument,
} from "../../demo/score-persistence-controls";
import {
  dispatchClick,
  dispatchEvent,
  FakeElement,
  makeButton,
  makeInput,
  makeText,
} from "../callbacks/helpers";

jest.mock("../../src/notation/model", () => {
  const actual = jest.requireActual("../../src/notation/model");
  return {
    ...actual,
    serializeScore: jest.fn((score: Score) => ({ name: score.name })),
    deserializeScore: jest.fn(
      (document: { name?: string }) =>
        new actual.Score([], document.name ?? "Restored score", "", "")
    ),
  };
});

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
  contents: string | Promise<string>
): void {
  Object.defineProperty(fileInput, "files", {
    configurable: true,
    value: [{ name, text: () => Promise.resolve(contents) }],
  });
  dispatchEvent(fileInput, "change");
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function verifyUnbound(
  controls: ReturnType<typeof createControls>,
  downloadDocument: jest.Mock,
  replaceScore: jest.Mock
): void {
  const downloadCalls = downloadDocument.mock.calls.length;
  const replaceCalls = replaceScore.mock.calls.length;
  const pickerCalls = (controls.fileInput.click as jest.Mock).mock.calls.length;
  dispatchClick(controls.serializeButton);
  dispatchClick(controls.deserializeButton);
  dispatchEvent(controls.fileInput, "change");
  expect(downloadDocument).toHaveBeenCalledTimes(downloadCalls);
  expect(replaceScore).toHaveBeenCalledTimes(replaceCalls);
  expect(controls.fileInput.click).toHaveBeenCalledTimes(pickerCalls);
}

describe("demo score persistence controls", () => {
  test("downloads the current score as formatted JSON", () => {
    const controls = createControls();
    const score = new Score([], "Current score", "Artist", "Song");
    const downloadDocument = jest.fn<void, [string, string]>();
    const replaceScore = jest.fn();
    const unbind = bindScorePersistenceControls({
      ...controls,
      getScore: () => score,
      replaceScore,
      downloadDocument,
    });

    dispatchClick(controls.serializeButton);

    expect(downloadDocument).toHaveBeenCalledTimes(1);
    const [contents, filename] = downloadDocument.mock.calls[0];
    const persistedScore = JSON.parse(contents) as {
      name: string;
    };
    expect(persistedScore.name).toBe("Current score");
    expect(filename).toBe("current-score.tabui.json");
    expect(controls.status.dataset.state).toBe("success");
    unbind();
    verifyUnbound(controls, downloadDocument, replaceScore);
  });

  test("opens a picker and replaces the score from the selected file", async () => {
    const controls = createControls();
    const source = new Score([], "Source", "Artist", "Song");
    const replaceScore = jest.fn<void, [Score]>();
    const downloadDocument = jest.fn();
    const unbind = bindScorePersistenceControls({
      ...controls,
      getScore: () => source,
      replaceScore,
      downloadDocument,
    });

    dispatchClick(controls.deserializeButton);
    expect(controls.fileInput.click).toHaveBeenCalledTimes(1);
    const serializedScore = serializeScore(source);
    serializedScore.name = "Restored from file";
    selectFile(
      controls.fileInput,
      "restored.tabui.json",
      JSON.stringify(serializedScore)
    );
    await flushPromises();

    expect(replaceScore).toHaveBeenCalledTimes(1);
    expect(replaceScore.mock.calls[0][0]).not.toBe(source);
    expect(replaceScore.mock.calls[0][0].name).toBe("Restored from file");
    expect(controls.status.dataset.state).toBe("success");
    expect(controls.deserializeButton.disabled).toBe(false);
    expect(controls.status.setAttribute).toHaveBeenLastCalledWith(
      "aria-busy",
      "false"
    );
    unbind();
    verifyUnbound(controls, downloadDocument, replaceScore);
  });

  test("keeps the mounted score when the selected file is invalid", async () => {
    const controls = createControls();
    const replaceScore = jest.fn<void, [Score]>();
    const downloadDocument = jest.fn();
    const unbind = bindScorePersistenceControls({
      ...controls,
      getScore: () => new Score(),
      replaceScore,
      downloadDocument,
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    selectFile(controls.fileInput, "broken.json", "{invalid");
    await flushPromises();

    expect(replaceScore).not.toHaveBeenCalled();
    expect(controls.status.dataset.state).toBe("error");
    expect(controls.status.textContent).toBeTruthy();
    consoleError.mockRestore();
    unbind();
    verifyUnbound(controls, downloadDocument, replaceScore);
  });

  test("only applies the latest selected file when reads finish out of order", async () => {
    const controls = createControls();
    const source = new Score([], "Source", "Artist", "Song");
    const firstRead = deferred<string>();
    const secondRead = deferred<string>();
    const replaceScore = jest.fn<void, [Score]>();
    const downloadDocument = jest.fn();
    const unbind = bindScorePersistenceControls({
      ...controls,
      getScore: () => source,
      replaceScore,
      downloadDocument,
    });
    const firstDocument = serializeScore(source);
    firstDocument.name = "Stale";
    const secondDocument = serializeScore(source);
    secondDocument.name = "Latest";

    selectFile(controls.fileInput, "stale.json", firstRead.promise);
    expect(controls.deserializeButton.disabled).toBe(true);
    expect(controls.status.setAttribute).toHaveBeenLastCalledWith(
      "aria-busy",
      "true"
    );
    selectFile(controls.fileInput, "latest.json", secondRead.promise);
    secondRead.resolve(JSON.stringify(secondDocument));
    await flushPromises();
    firstRead.resolve(JSON.stringify(firstDocument));
    await flushPromises();

    expect(replaceScore).toHaveBeenCalledTimes(1);
    expect(replaceScore.mock.calls[0][0].name).toBe("Latest");
    expect(controls.status.textContent).toBe("Mounted score from latest.json.");
    expect(controls.deserializeButton.disabled).toBe(false);
    unbind();
    verifyUnbound(controls, downloadDocument, replaceScore);
  });

  test("unbind invalidates a pending read and prevents later dispatch", async () => {
    const controls = createControls();
    const source = new Score([], "Source", "Artist", "Song");
    const read = deferred<string>();
    const replaceScore = jest.fn<void, [Score]>();
    const downloadDocument = jest.fn();
    const unbind = bindScorePersistenceControls({
      ...controls,
      getScore: () => source,
      replaceScore,
      downloadDocument,
    });

    selectFile(controls.fileInput, "pending.json", read.promise);
    unbind();
    expect(controls.deserializeButton.disabled).toBe(false);
    read.resolve(JSON.stringify(serializeScore(source)));
    await flushPromises();

    expect(replaceScore).not.toHaveBeenCalled();
    expect(controls.status.textContent).toBe("");
    verifyUnbound(controls, downloadDocument, replaceScore);
  });

  test("reports a score replacement failure without claiming success", async () => {
    const controls = createControls();
    const source = new Score([], "Source", "Artist", "Song");
    const replaceScore = jest.fn(() => {
      throw new Error("Could not mount restored score");
    });
    const downloadDocument = jest.fn();
    const unbind = bindScorePersistenceControls({
      ...controls,
      getScore: () => source,
      replaceScore,
      downloadDocument,
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    selectFile(
      controls.fileInput,
      "valid.json",
      JSON.stringify(serializeScore(source))
    );
    await flushPromises();

    expect(controls.status.dataset.state).toBe("error");
    expect(controls.status.textContent).toBe("Could not mount restored score");
    consoleError.mockRestore();
    unbind();
    verifyUnbound(controls, downloadDocument, replaceScore);
  });

  test("cleans the download anchor and revokes its URL after click returns", () => {
    jest.useFakeTimers();
    const originalDocument = globalThis.document;
    const originalUrl = globalThis.URL;
    const anchor = {
      click: jest.fn(),
      remove: jest.fn(),
      href: "",
      download: "",
    };
    const appendChild = jest.fn();
    const createObjectURL = jest.fn(() => "blob:score");
    const revokeObjectURL = jest.fn();
    (globalThis as any).document = {
      createElement: jest.fn(() => anchor),
      body: { appendChild },
    };
    (globalThis as any).URL = { createObjectURL, revokeObjectURL };

    try {
      downloadScoreDocument("{}", "score.tabui.json");

      expect(anchor.click).toHaveBeenCalledTimes(1);
      expect(anchor.remove).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).not.toHaveBeenCalled();
      jest.runOnlyPendingTimers();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:score");
    } finally {
      (globalThis as any).document = originalDocument;
      (globalThis as any).URL = originalUrl;
      jest.useRealTimers();
    }
  });

  test("cleans download resources when the browser click fails", () => {
    jest.useFakeTimers();
    const originalDocument = globalThis.document;
    const originalUrl = globalThis.URL;
    const clickError = new Error("download blocked");
    const anchor = {
      click: jest.fn(() => {
        throw clickError;
      }),
      remove: jest.fn(),
      href: "",
      download: "",
    };
    const revokeObjectURL = jest.fn();
    (globalThis as any).document = {
      createElement: jest.fn(() => anchor),
      body: { appendChild: jest.fn() },
    };
    (globalThis as any).URL = {
      createObjectURL: jest.fn(() => "blob:score"),
      revokeObjectURL,
    };

    try {
      expect(() => downloadScoreDocument("{}", "score.json")).toThrow(
        clickError
      );
      expect(anchor.remove).toHaveBeenCalledTimes(1);
      jest.runOnlyPendingTimers();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:score");
    } finally {
      (globalThis as any).document = originalDocument;
      (globalThis as any).URL = originalUrl;
      jest.useRealTimers();
    }
  });
});
