import { File } from "node:buffer";
import { setImmediate } from "node:timers";
import { JSDOM } from "jsdom";
import { deserializeScore, Score } from "../../../src/notation/model";
import { TabUIEditor } from "../../../src/tabui-editor";
import {
  bindScorePersistenceControls,
  downloadScoreDocument,
} from "../../../demo/score-persistence-controls";
import { required } from "../required";

// A known V1 file, independent of the serializer used by the export controls.
function importedDocument(name = "Imported study", fret = 7): string {
  return JSON.stringify({
    format: "tabui-score",
    version: 1,
    name,
    artist: "Ada",
    song: "Evening",
    masterVolume: 0.8,
    masterPan: -0.2,
    masterBars: [
      {
        tempo: 96,
        beatsCount: 4,
        duration: "quarter",
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      },
    ],
    tracks: [
      {
        instrument: {
          family: "Strings",
          name: "Electric Guitar",
          program: 27,
          stringsCount: 6,
          fretsCount: 24,
          tuning: [
            { noteValue: "E", octave: 4 },
            { noteValue: "B", octave: 3 },
            { noteValue: "G", octave: 3 },
            { noteValue: "D", octave: 3 },
            { noteValue: "A", octave: 2 },
            { noteValue: "E", octave: 2 },
          ],
          type: "Electric Guitar",
          tone: "Electric Clean",
        },
        name: "Lead guitar",
        volume: 0.5,
        pan: 0,
        muted: false,
        soloed: false,
        staves: [
          {
            clefType: "Treble",
            showTablature: true,
            showClassicNotation: false,
            bars: [
              {
                voices: [
                  {
                    beats: [
                      {
                        notes: [
                          { fret, techniques: [] },
                          null,
                          null,
                          null,
                          null,
                          null,
                        ],
                        duration: "quarter",
                        dots: 0,
                        tuplet: null,
                      },
                    ],
                  },
                  null,
                  null,
                  null,
                ],
              },
            ],
          },
        ],
      },
    ],
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function flushPromises(): Promise<void> {
  // Let File.text() and the async DOM listener finish before the next turn.
  await new Promise<void>((resolve) => setImmediate(resolve));
}

describe("demo score persistence controls", () => {
  let dom: JSDOM;
  const originalGlobals = new Map<string, PropertyDescriptor | undefined>();
  const cleanups: (() => void)[] = [];

  beforeEach(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", {
      pretendToBeVisual: true,
    });
    const browserGlobals = new Map<string, unknown>([
      ["window", dom.window],
      ["document", dom.window.document],
      ["HTMLElement", dom.window.HTMLElement],
      ["Element", dom.window.Element],
      ["Node", dom.window.Node],
      ["SVGElement", dom.window.SVGElement],
      ["SVGRectElement", dom.window.SVGElement],
      ["Event", dom.window.Event],
      ["KeyboardEvent", dom.window.KeyboardEvent],
      ["getComputedStyle", dom.window.getComputedStyle.bind(dom.window)],
      ["ResizeObserver", undefined],
      [
        "requestAnimationFrame",
        dom.window.requestAnimationFrame.bind(dom.window),
      ],
      [
        "cancelAnimationFrame",
        dom.window.cancelAnimationFrame.bind(dom.window),
      ],
    ]);
    for (const [name, value] of browserGlobals) {
      originalGlobals.set(
        name,
        Object.getOwnPropertyDescriptor(globalThis, name)
      );
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value,
      });
    }
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
    jest.restoreAllMocks();
    jest.useRealTimers();
    dom.window.close();
    for (const [name, descriptor] of originalGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
    originalGlobals.clear();
  });

  function mount(replaceScore?: (score: Score) => void) {
    const root = document.createElement("div");
    const serializeButton = document.createElement("button");
    const deserializeButton = document.createElement("button");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    const status = document.createElement("p");
    document.body.append(
      root,
      serializeButton,
      deserializeButton,
      fileInput,
      status
    );
    let editor = new TabUIEditor(
      root,
      new Score([], "Current score", "Artist", "Song"),
      {
        layout: { width: 1200 },
      }
    );
    editor.init();
    cleanups.push(() => editor.dispose());
    const unbind = bindScorePersistenceControls({
      serializeButton,
      deserializeButton,
      fileInput,
      status,
      getScore: () => editor.score,
      replaceScore:
        replaceScore ??
        ((score) => {
          editor.dispose();
          editor = new TabUIEditor(root, score, { layout: { width: 1200 } });
          editor.init();
        }),
      downloadDocument: downloadScoreDocument,
    });
    cleanups.push(unbind);
    return {
      root,
      serializeButton,
      deserializeButton,
      fileInput,
      status,
      unbind,
      score: () => editor.score,
      frets: () =>
        Array.from(
          root.querySelectorAll(".tu-root-svg text"),
          (v) => v.textContent
        ),
    };
  }

  function selectFile(fileInput: HTMLInputElement, file: File): void {
    // jsdom cannot operate an OS picker. Supply its files/path at that boundary.
    Object.defineProperties(fileInput, {
      files: { configurable: true, value: [file] },
      value: {
        configurable: true,
        writable: true,
        value: `C:\\fakepath\\${file.name}`,
      },
    });
    fileInput.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  }

  function browserDownloads() {
    jest.useFakeTimers();
    cleanups.push(() => jest.runOnlyPendingTimers());
    const blobs: Blob[] = [];
    jest.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      if (!(blob instanceof Blob)) throw new Error("Expected a download Blob");
      blobs.push(blob);
      return "blob:score";
    });
    const revokeObjectURL = jest
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation();
    const anchors: HTMLAnchorElement[] = [];
    const click = jest
      .spyOn(dom.window.HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.isConnected).toBe(true);
        anchors.push(this);
      });
    return { blobs, revokeObjectURL, anchors, click };
  }

  test("downloads a restorable current score with JSON bytes, filename, and temporary resource cleanup", async () => {
    const downloads = browserDownloads();
    const controls = mount();

    controls.serializeButton.click();

    const anchor = required(downloads.anchors[0]);
    expect(anchor.download).toBe("current-score.tabui.json");
    expect(anchor.href).toBe("blob:score");
    expect(anchor.isConnected).toBe(false);
    const blob = required(downloads.blobs[0]);
    expect(blob.type).toBe("application/json");
    const contents = await blob.text();
    expect(contents).toContain('\n  "format": "tabui-score",');
    const restored = deserializeScore(JSON.parse(contents) as unknown);
    expect(restored.name).toBe("Current score");
    expect(restored.artist).toBe("Artist");
    expect(restored.song).toBe("Song");
    expect(restored.tracks).toHaveLength(1);
    expect(
      restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0].notes
    ).toBeNull();
    expect(controls.status.dataset.state).toBe("success");
    expect(controls.status.textContent).toBe(
      "Downloaded current-score.tabui.json."
    );
    expect(downloads.revokeObjectURL).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(downloads.revokeObjectURL).toHaveBeenCalledWith("blob:score");
  });

  test("opens the picker, renders an imported score, and exports that score on the next click", async () => {
    const downloads = browserDownloads();
    const controls = mount();
    const picker = jest.spyOn(controls.fileInput, "click").mockImplementation();
    controls.deserializeButton.click();
    expect(picker).toHaveBeenCalledTimes(1);

    selectFile(
      controls.fileInput,
      new File([importedDocument()], "study.tabui.json")
    );
    await flushPromises();

    expect(controls.score().name).toBe("Imported study");
    expect(controls.score().artist).toBe("Ada");
    expect(controls.score().masterBars[0].tempo).toBe(96);
    expect(controls.frets()).toContain("7");
    expect(controls.status.dataset.state).toBe("success");
    expect(controls.status.textContent).toBe(
      "Mounted score from study.tabui.json."
    );
    expect(controls.deserializeButton.disabled).toBe(false);
    expect(controls.status.getAttribute("aria-busy")).toBe("false");
    expect(controls.fileInput.value).toBe("");

    controls.serializeButton.click();
    expect(required(downloads.anchors[0]).download).toBe(
      "imported-study.tabui.json"
    );
    const contents = await required(downloads.blobs[0]).text();
    expect(JSON.parse(contents)).toEqual(JSON.parse(importedDocument()));
  });

  test.each([
    ["malformed JSON", "{invalid"],
    ["invalid score data", '{"name":"Not a score"}'],
  ])(
    "preserves the mounted score after %s and permits retrying the same filename",
    async (_description, contents) => {
      jest.spyOn(console, "error").mockImplementation();
      const controls = mount();
      const original = controls.score();
      const rendered = required(controls.root.querySelector(".tu-root-svg"));

      selectFile(controls.fileInput, new File([contents], "study.json"));
      await flushPromises();

      expect(controls.score()).toBe(original);
      expect(controls.root.querySelector(".tu-root-svg")).toBe(rendered);
      expect(controls.status.dataset.state).toBe("error");
      expect(controls.status.textContent).not.toBe("");
      expect(controls.fileInput.value).toBe("");
      expect(controls.deserializeButton.disabled).toBe(false);
      expect(controls.status.getAttribute("aria-busy")).toBe("false");

      selectFile(
        controls.fileInput,
        new File([importedDocument()], "study.json")
      );
      await flushPromises();
      expect(controls.frets()).toContain("7");
      expect(controls.score().name).toBe("Imported study");
      expect(controls.status.dataset.state).toBe("success");
      expect(controls.fileInput.value).toBe("");
    }
  );

  test("only renders the latest selected file when reads finish out of order", async () => {
    const controls = mount();
    const firstRead = deferred<string>();
    const secondRead = deferred<string>();
    const firstFile = new File([importedDocument("Stale", 3)], "stale.json");
    const secondFile = new File([importedDocument("Latest", 9)], "latest.json");
    jest.spyOn(firstFile, "text").mockReturnValue(firstRead.promise);
    jest.spyOn(secondFile, "text").mockReturnValue(secondRead.promise);

    selectFile(controls.fileInput, firstFile);
    expect(controls.deserializeButton.disabled).toBe(true);
    expect(controls.status.getAttribute("aria-busy")).toBe("true");
    selectFile(controls.fileInput, secondFile);
    secondRead.resolve(importedDocument("Latest", 9));
    await flushPromises();
    const latest = controls.score();
    firstRead.resolve(importedDocument("Stale", 3));
    await flushPromises();

    expect(controls.score()).toBe(latest);
    expect(controls.score().name).toBe("Latest");
    expect(controls.frets()).toContain("9");
    expect(controls.frets()).not.toContain("3");
    expect(controls.status.textContent).toBe("Mounted score from latest.json.");
    expect(controls.deserializeButton.disabled).toBe(false);
    expect(controls.status.getAttribute("aria-busy")).toBe("false");
    expect(controls.fileInput.value).toBe("");
  });

  test("unbind invalidates a pending read and removes all three DOM listeners", async () => {
    const downloads = browserDownloads();
    const controls = mount();
    const original = controls.score();
    const rendered = required(controls.root.querySelector(".tu-root-svg"));
    const picker = jest.spyOn(controls.fileInput, "click").mockImplementation();
    const read = deferred<string>();
    const file = new File([importedDocument()], "pending.json");
    const pendingRead = jest.spyOn(file, "text").mockReturnValue(read.promise);
    selectFile(controls.fileInput, file);
    expect(pendingRead).toHaveBeenCalledTimes(1);
    expect(controls.deserializeButton.disabled).toBe(true);
    expect(controls.status.getAttribute("aria-busy")).toBe("true");

    controls.unbind();
    expect(controls.deserializeButton.disabled).toBe(false);
    expect(controls.status.getAttribute("aria-busy")).toBe("false");
    read.resolve(importedDocument());
    await flushPromises();
    controls.serializeButton.click();
    controls.deserializeButton.click();
    const laterFile = new File([importedDocument()], "later.json");
    const laterRead = jest.spyOn(laterFile, "text");
    selectFile(controls.fileInput, laterFile);
    await flushPromises();

    expect(controls.deserializeButton.disabled).toBe(false);
    expect(controls.status.getAttribute("aria-busy")).toBe("false");
    expect(laterRead).not.toHaveBeenCalled();
    expect(controls.score()).toBe(original);
    expect(controls.root.querySelector(".tu-root-svg")).toBe(rendered);
    expect(controls.status.textContent).toBe("");
    expect(downloads.anchors).toEqual([]);
    expect(picker).not.toHaveBeenCalled();
  });

  test("reports a host score replacement failure and releases the file input for retry", async () => {
    jest.spyOn(console, "error").mockImplementation();
    const controls = mount(() => {
      throw new Error("Could not mount restored score");
    });
    const original = controls.score();
    const rendered = required(controls.root.querySelector(".tu-root-svg"));
    selectFile(
      controls.fileInput,
      new File([importedDocument()], "valid.json")
    );
    await flushPromises();

    expect(controls.score()).toBe(original);
    expect(controls.root.querySelector(".tu-root-svg")).toBe(rendered);
    expect(controls.status.dataset.state).toBe("error");
    expect(controls.status.textContent).toBe("Could not mount restored score");
    expect(controls.fileInput.value).toBe("");
    expect(controls.deserializeButton.disabled).toBe(false);
    expect(controls.status.getAttribute("aria-busy")).toBe("false");
  });

  test("cleans download resources and reports failure when the browser blocks the click", () => {
    jest.spyOn(console, "error").mockImplementation();
    const downloads = browserDownloads();
    const controls = mount();
    downloads.click.mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.isConnected).toBe(true);
      downloads.anchors.push(this);
      throw new Error("download blocked");
    });

    controls.serializeButton.click();

    expect(required(downloads.anchors[0]).isConnected).toBe(false);
    expect(controls.status.dataset.state).toBe("error");
    expect(controls.status.textContent).toBe("download blocked");
    expect(downloads.revokeObjectURL).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(downloads.revokeObjectURL).toHaveBeenCalledWith("blob:score");
  });
});
