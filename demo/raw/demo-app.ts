import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  InstrumentTone,
  NoteValue,
  OtherStringTone,
  PlaybackConfig,
  Score,
  TabUIConfig,
  TabUIEditor,
  TabUIEditorMode,
  TabUILayoutMode,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
} from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";
import "./demo-app.css";
import {
  EditorFixtureKey,
  getEditorFixtures,
  resolveEditorFixtureKey,
} from "./data/fixture";
import {
  applyEditorThemeToPage,
  EditorThemeKey,
  getEditorThemeConfig,
  getEditorThemes,
  resolveEditorThemeKey,
} from "./data/theme";
import { DEMO_TEMPLATE } from "./demo-template";
import {
  bindScorePersistenceControls,
  downloadScoreDocument,
} from "./score-persistence-controls";

/** Tells the demo whether the host page is dark, and when that changes. */
export type DemoAppearance = {
  isDark: () => boolean;
  subscribe: (listener: () => void) => () => void;
};

export type DemoOptions = {
  /** URL of the folder that holds `samples/`, ending with a slash. */
  assetBaseUrl: string;
  /** Page appearance for the "Auto" theme. Defaults to the system setting. */
  appearance?: DemoAppearance;
  /** Whether to color the page itself with the editor theme. */
  shouldThemePage?: boolean;
};

type DemoPanelVisibility = "default" | "visible" | "hidden";
type DemoSoundSource = "fluidr3" | "samples" | "synths";

/** All demo settings. Each one is stored in the URL so that links keep them. */
type DemoSettings = {
  fixture: EditorFixtureKey;
  theme: EditorThemeKey;
  soundSource: DemoSoundSource;
  mode: TabUIEditorMode;
  layoutMode: TabUILayoutMode;
  scorePanel: DemoPanelVisibility;
  scorePanelPlacement: TabUIScorePanelPlacement;
  sidePanel: DemoPanelVisibility;
  sidePanelPlacement: TabUISidePanelPlacement;
  sidePanelCollapsible: boolean;
  sidePanelCollapsed: boolean;
};

function readSettings(params: URLSearchParams): DemoSettings {
  const soundSource = params.get("soundSource");
  const isCollapsible = params.get("sidePanelCollapsible") !== "false";
  return {
    fixture: resolveEditorFixtureKey(params),
    theme: resolveEditorThemeKey(params),
    soundSource:
      soundSource === "synths" || soundSource === "samples"
        ? soundSource
        : "fluidr3",
    mode:
      params.get("mode") === TabUIEditorMode.ViewOnly
        ? TabUIEditorMode.ViewOnly
        : TabUIEditorMode.Edit,
    layoutMode:
      params.get("layoutMode") === TabUILayoutMode.SingleLine
        ? TabUILayoutMode.SingleLine
        : TabUILayoutMode.Wrapped,
    scorePanel: readPanelVisibility(params.get("scorePanel")),
    scorePanelPlacement:
      params.get("scorePanelPlacement") === TabUIScorePanelPlacement.Bottom
        ? TabUIScorePanelPlacement.Bottom
        : TabUIScorePanelPlacement.Top,
    sidePanel: readPanelVisibility(params.get("sidePanel")),
    sidePanelPlacement:
      params.get("sidePanelPlacement") === TabUISidePanelPlacement.Right
        ? TabUISidePanelPlacement.Right
        : TabUISidePanelPlacement.Left,
    sidePanelCollapsible: isCollapsible,
    sidePanelCollapsed:
      isCollapsible && params.get("sidePanelCollapsed") === "true",
  };
}

function readPanelVisibility(value: string | null): DemoPanelVisibility {
  return value === "visible" || value === "hidden" ? value : "default";
}

function writeSettings(settings: DemoSettings): void {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(settings)) {
    params.set(key, String(value));
  }
  window.history.replaceState(window.history.state, "", `?${params}`);
}

function visibilityOverride(value: DemoPanelVisibility): boolean | undefined {
  return value === "default" ? undefined : value === "visible";
}

/** A sample file and the pitch it was recorded at. */
type DemoSample = [
  tone: InstrumentTone,
  file: string,
  noteValue: NoteValue,
  octave: number,
];

const FREE_WAVE_SAMPLES: DemoSample[] = [
  [
    ElectricGuitarTone.Clean,
    "Alesis-Fusion-Clean-Guitar-C3.wav",
    NoteValue.C,
    3,
  ],
  [
    ElectricGuitarTone.Overdrive,
    "Roland-SC-88-Overdriven-Guitar-C3.wav",
    NoteValue.C,
    3,
  ],
  [
    ElectricGuitarTone.Distortion,
    "Roland-SC-88-Distorted-Guitar-C3.wav",
    NoteValue.C,
    3,
  ],
  [BassGuitarTone.Clean, "Alesis-S4-Plus-FatSynSlap-C2.wav", NoteValue.C, 2],
  [
    AcousticGuitarTone.Nylon,
    "Alesis-Fusion-Nylon-String-Guitar-C4.wav",
    NoteValue.C,
    4,
  ],
  [
    AcousticGuitarTone.Steel,
    "Alesis-Fusion-Steel-String-Guitar-C4.wav",
    NoteValue.C,
    4,
  ],
];

/** FluidR3 extracts are tuned offline to B3 (guitars) or C2 (bass). */
const FLUIDR3_SAMPLES: DemoSample[] = [
  [ElectricGuitarTone.Clean, "fluidr3/clean-electric-B3.wav", NoteValue.B, 3],
  [
    ElectricGuitarTone.Overdrive,
    "fluidr3/overdrive-electric-B3.wav",
    NoteValue.B,
    3,
  ],
  [
    ElectricGuitarTone.Distortion,
    "fluidr3/distorted-electric-B3.wav",
    NoteValue.B,
    3,
  ],
  [BassGuitarTone.Clean, "fluidr3/fingered-bass-C2.wav", NoteValue.C, 2],
  [AcousticGuitarTone.Nylon, "fluidr3/nylon-acoustic-B3.wav", NoteValue.B, 3],
  [AcousticGuitarTone.Steel, "fluidr3/steel-acoustic-B3.wav", NoteValue.B, 3],
];

/**
 * Tones without their own sample play the closest one instead of a synth.
 * The ukulele and banjo picks match TabUI's MIDI mapping for these tones.
 */
const SHARED_SAMPLES: [tone: InstrumentTone, sampleTone: InstrumentTone][] = [
  [OtherStringTone.Ukulele, AcousticGuitarTone.Nylon],
  [OtherStringTone.Banjo, AcousticGuitarTone.Steel],
  [BassGuitarTone.Acoustic, BassGuitarTone.Clean],
  [BassGuitarTone.Distortion, BassGuitarTone.Clean],
];

function createPlayback(
  source: DemoSoundSource,
  baseUrl: string
): PlaybackConfig {
  if (source === "synths") {
    return { preloadAudio: false };
  }
  const list = source === "samples" ? FREE_WAVE_SAMPLES : FLUIDR3_SAMPLES;
  const samples: PlaybackConfig["samples"] = {};
  for (const [tone, file, noteValue, octave] of list) {
    samples[tone] = {
      url: `${baseUrl}samples/${file}`,
      rootNote: { noteValue, octave },
    };
  }
  for (const [tone, sampleTone] of SHARED_SAMPLES) {
    samples[tone] = samples[sampleTone];
  }
  return { preloadAudio: true, samples };
}

function systemAppearance(): DemoAppearance {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  return {
    isDark: () => query.matches,
    subscribe: (listener) => {
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    },
  };
}

function requiredElement<T extends HTMLElement>(
  root: HTMLElement,
  selector: string,
  constructor: { new (): T }
): T {
  const element = root.querySelector(selector);
  if (!(element instanceof constructor)) {
    throw new Error(`Could not get ${selector} element`);
  }
  return element;
}

function fillFixtureSelect(select: HTMLSelectElement): void {
  for (const fixture of getEditorFixtures()) {
    select.append(new Option(fixture.label, fixture.key));
  }
}

function fillThemeSelect(select: HTMLSelectElement): void {
  const groups: [string, HTMLOptionElement[]][] = [
    ["Basic", [new Option("Auto", "auto")]],
    ["Dark", []],
    ["Light", []],
  ];
  for (const theme of getEditorThemes()) {
    const option = new Option(theme.label, theme.key);
    const isBasic = theme.key === "light" || theme.key === "dark";
    const group = isBasic ? groups[0] : theme.isDark ? groups[1] : groups[2];
    group[1].push(option);
  }
  for (const [label, options] of groups) {
    const group = document.createElement("optgroup");
    group.label = label;
    group.append(...options);
    select.append(group);
  }
}

/**
 * Renders the demo controls and editor into the host element.
 * Returns a function that removes them and disposes the editor.
 */
export function mountDemo(host: HTMLElement, options: DemoOptions): () => void {
  const appearance = options.appearance ?? systemAppearance();
  host.innerHTML = DEMO_TEMPLATE.replaceAll(
    "%ASSET_BASE%",
    options.assetBaseUrl
  );

  const editorRoot = requiredElement(host, "#tabui-editor", HTMLDivElement);
  const fixtureSelect = requiredElement(
    host,
    "#fixture-select",
    HTMLSelectElement
  );
  const themeSelect = requiredElement(host, "#theme-select", HTMLSelectElement);
  const soundSourceSelect = requiredElement(
    host,
    "#sound-source-select",
    HTMLSelectElement
  );
  const scorePanelSelect = requiredElement(
    host,
    "#score-panel-visibility-select",
    HTMLSelectElement
  );
  const scorePanelPlacementSelect = requiredElement(
    host,
    "#score-panel-placement-select",
    HTMLSelectElement
  );
  const sidePanelSelect = requiredElement(
    host,
    "#side-panel-visibility-select",
    HTMLSelectElement
  );
  const sidePanelPlacementSelect = requiredElement(
    host,
    "#side-panel-placement-select",
    HTMLSelectElement
  );
  const collapsibleCheckbox = requiredElement(
    host,
    "#side-panel-collapsible",
    HTMLInputElement
  );
  const collapsedCheckbox = requiredElement(
    host,
    "#side-panel-collapsed",
    HTMLInputElement
  );
  const panelsMenu = requiredElement(host, "#panels-menu", HTMLDetailsElement);
  const resetButton = requiredElement(
    host,
    "#reset-demo-settings",
    HTMLButtonElement
  );
  fillFixtureSelect(fixtureSelect);
  fillThemeSelect(themeSelect);

  const radios = (name: string): HTMLInputElement[] =>
    [...host.querySelectorAll(`input[name="${name}"]`)].filter(
      (v) => v instanceof HTMLInputElement
    );

  function showSettings(settings: DemoSettings): void {
    fixtureSelect.value = settings.fixture;
    themeSelect.value = settings.theme;
    soundSourceSelect.value = settings.soundSource;
    for (const radio of radios("interaction-mode")) {
      radio.checked = radio.value === settings.mode;
    }
    for (const radio of radios("layout-mode")) {
      radio.checked = radio.value === settings.layoutMode;
    }
    scorePanelSelect.value = settings.scorePanel;
    scorePanelPlacementSelect.value = settings.scorePanelPlacement;
    sidePanelSelect.value = settings.sidePanel;
    sidePanelPlacementSelect.value = settings.sidePanelPlacement;
    collapsibleCheckbox.checked = settings.sidePanelCollapsible;
    collapsedCheckbox.checked = settings.sidePanelCollapsed;
    collapsedCheckbox.disabled = !settings.sidePanelCollapsible;
  }

  /** Reads the controls back into URL form, so one parser handles both. */
  function readControls(): DemoSettings {
    const params = new URLSearchParams();
    params.set("fixture", fixtureSelect.value);
    params.set("theme", themeSelect.value);
    params.set("soundSource", soundSourceSelect.value);
    const mode = radios("interaction-mode").find((v) => v.checked);
    params.set("mode", mode?.value ?? "");
    const layout = radios("layout-mode").find((v) => v.checked);
    params.set("layoutMode", layout?.value ?? "");
    params.set("scorePanel", scorePanelSelect.value);
    params.set("scorePanelPlacement", scorePanelPlacementSelect.value);
    params.set("sidePanel", sidePanelSelect.value);
    params.set("sidePanelPlacement", sidePanelPlacementSelect.value);
    params.set("sidePanelCollapsible", String(collapsibleCheckbox.checked));
    params.set("sidePanelCollapsed", String(collapsedCheckbox.checked));
    return readSettings(params);
  }

  function createConfig(settings: DemoSettings): TabUIConfig {
    const themeConfig = getEditorThemeConfig(
      settings.theme,
      appearance.isDark()
    );
    if (options.shouldThemePage) {
      applyEditorThemeToPage(themeConfig);
    }
    const scoreVisibility = visibilityOverride(settings.scorePanel);
    const sideVisibility = visibilityOverride(settings.sidePanel);
    return {
      ...themeConfig,
      playback: createPlayback(settings.soundSource, options.assetBaseUrl),
      interaction: { mode: settings.mode },
      layout: { mode: settings.layoutMode },
      panels: {
        score: {
          ...(scoreVisibility === undefined
            ? {}
            : { visible: scoreVisibility }),
          placement: settings.scorePanelPlacement,
        },
        side: {
          ...(sideVisibility === undefined ? {} : { visible: sideVisibility }),
          placement: settings.sidePanelPlacement,
          collapsible: settings.sidePanelCollapsible,
          initiallyCollapsed: settings.sidePanelCollapsed,
        },
      },
    };
  }

  function createFixtureScore(key: EditorFixtureKey): Score {
    if (key === "performance_stress") {
      console.log("=== PERF MODE ===", "Performance stress score enabled");
    }
    const fixture = getEditorFixtures().find((v) => v.key === key);
    if (fixture === undefined) {
      throw new Error(`Unknown fixture key: ${key}`);
    }
    return fixture.createScore();
  }

  function mountEditor(score: Score, config: TabUIConfig): TabUIEditor {
    const editor = new TabUIEditor(editorRoot, score, config);
    editor.init();
    return editor;
  }

  let settings = readSettings(new URLSearchParams(window.location.search));
  showSettings(settings);
  let config = createConfig(settings);
  let editor = mountEditor(createFixtureScore(settings.fixture), config);

  /** Remounts the editor. On failure, restores the previous editor and settings. */
  function remount(next: DemoSettings, score: Score): void {
    const previous = { settings, config, score: editor.score };
    editor.dispose();
    try {
      const nextConfig = createConfig(next);
      editor = mountEditor(score, nextConfig);
      settings = next;
      config = nextConfig;
      writeSettings(settings);
    } catch (error) {
      editor = mountEditor(previous.score, createConfig(previous.settings));
      showSettings(previous.settings);
      throw error;
    }
  }

  function onControlChange(): void {
    const next = readControls();
    showSettings(next);
    const isNewFixture = next.fixture !== settings.fixture;
    const score = isNewFixture
      ? createFixtureScore(next.fixture)
      : editor.score;
    remount(next, score);
  }

  function onReset(): void {
    const defaults = readSettings(new URLSearchParams());
    showSettings(defaults);
    remount(defaults, createFixtureScore(defaults.fixture));
  }

  function onAppearanceChange(): void {
    if (settings.theme === "auto") {
      remount(settings, editor.score);
    }
  }

  /** Closes the Panels menu on Escape or on a click outside it. */
  function onDocumentPointerDown(event: PointerEvent): void {
    const isInside =
      event.target instanceof Node && panelsMenu.contains(event.target);
    if (panelsMenu.open && !isInside) {
      panelsMenu.open = false;
    }
  }

  /** Opens the menu toward the left when it would leave the screen. */
  function onPanelsToggle(): void {
    panelsMenu.classList.remove("demo-menu-end");
    const content = panelsMenu.querySelector(".demo-menu-content");
    if (!panelsMenu.open || content === null) {
      return;
    }
    const isOffscreen =
      content.getBoundingClientRect().right >
      document.documentElement.clientWidth;
    panelsMenu.classList.toggle("demo-menu-end", isOffscreen);
  }

  function onPanelsKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !panelsMenu.open) {
      return;
    }
    panelsMenu.open = false;
    panelsMenu.querySelector("summary")?.focus();
  }

  const controlsForm = requiredElement(host, ".demo-toolbar", HTMLElement);
  controlsForm.addEventListener("change", onControlChange);
  resetButton.addEventListener("click", onReset);
  document.addEventListener("pointerdown", onDocumentPointerDown);
  panelsMenu.addEventListener("keydown", onPanelsKeyDown);
  panelsMenu.addEventListener("toggle", onPanelsToggle);
  const unsubscribeAppearance = appearance.subscribe(onAppearanceChange);

  const unbindPersistence = bindScorePersistenceControls({
    serializeButton: requiredElement(
      host,
      "#serialize-score",
      HTMLButtonElement
    ),
    deserializeButton: requiredElement(
      host,
      "#deserialize-score",
      HTMLButtonElement
    ),
    fileInput: requiredElement(host, "#score-file", HTMLInputElement),
    status: requiredElement(host, "#score-persistence-status", HTMLElement),
    getScore: () => editor.score,
    replaceScore: (score) => remount(settings, score),
    downloadDocument: downloadScoreDocument,
  });

  return () => {
    controlsForm.removeEventListener("change", onControlChange);
    resetButton.removeEventListener("click", onReset);
    document.removeEventListener("pointerdown", onDocumentPointerDown);
    panelsMenu.removeEventListener("keydown", onPanelsKeyDown);
    panelsMenu.removeEventListener("toggle", onPanelsToggle);
    unsubscribeAppearance();
    unbindPersistence();
    editor.dispose();
    host.replaceChildren();
  };
}
