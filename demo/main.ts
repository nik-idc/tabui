import { TabUIEditor } from "../src/tabui-editor";
import {
  TabUIConfig,
  TabUIEditorMode,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
} from "../src/config/tabui-config";
import "../src/styles.scss";
import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  NoteValue,
  Score,
} from "../src/notation";
import {
  getEditorFixtures,
  resolveEditorFixture,
  resolveEditorFixtureKey,
} from "./data/fixture";
import {
  applyEditorThemeToPage,
  getEditorThemes,
  resolveEditorTheme,
  resolveEditorThemeKey,
} from "./data/theme";
import {
  bindScorePersistenceControls,
  downloadScoreDocument,
} from "./score-persistence-controls";

const CLEAN_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Alesis-Fusion-Clean-Guitar-C3.wav`;
const OVERDRIVEN_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Roland-SC-88-Overdriven-Guitar-C3.wav`;
const DISTORTED_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Roland-SC-88-Distorted-Guitar-C3.wav`;
const SLAP_BASS_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Alesis-S4-Plus-FatSynSlap-C2.wav`;
const NYLON_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Alesis-Fusion-Nylon-String-Guitar-C4.wav`;
const STEEL_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Alesis-Fusion-Steel-String-Guitar-C4.wav`;

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Could not get #${id} element`);
  }
  return element as T;
}

const rootDiv = requiredElement<HTMLDivElement>("tabui-editor");
const searchParams = new URLSearchParams(window.location.search);
const fixtureSelect = document.getElementById(
  "fixture-select"
) as HTMLSelectElement | null;
const themeSelect = document.getElementById(
  "theme-select"
) as HTMLSelectElement | null;
const interactionModeSelect = requiredElement<HTMLSelectElement>(
  "interaction-mode-select"
);
const scorePanelVisibilitySelect = requiredElement<HTMLSelectElement>(
  "score-panel-visibility-select"
);
const scorePanelPlacementSelect = requiredElement<HTMLSelectElement>(
  "score-panel-placement-select"
);
const sidePanelVisibilitySelect = requiredElement<HTMLSelectElement>(
  "side-panel-visibility-select"
);
const sidePanelPlacementSelect = requiredElement<HTMLSelectElement>(
  "side-panel-placement-select"
);
const sidePanelCollapsibleSelect = requiredElement<HTMLSelectElement>(
  "side-panel-collapsible-select"
);
const sidePanelCollapsedSelect = requiredElement<HTMLSelectElement>(
  "side-panel-collapsed-select"
);
const serializeButton = requiredElement<HTMLButtonElement>("serialize-score");
const deserializeButton =
  requiredElement<HTMLButtonElement>("deserialize-score");
const scoreFileInput = requiredElement<HTMLInputElement>("score-file");
const persistenceStatus = requiredElement<HTMLDivElement>(
  "score-persistence-status"
);
const resetDemoSettingsButton = requiredElement<HTMLButtonElement>(
  "reset-demo-settings"
);

const selectedFixture = resolveEditorFixtureKey(searchParams);
const selectedTheme = resolveEditorThemeKey(searchParams);
const selectedScore = resolveEditorFixture(searchParams);
const selectedThemeConfig = resolveEditorTheme(searchParams);

type DemoPanelVisibility = "default" | "visible" | "hidden";

function resolveInteractionMode(value: string | null): TabUIEditorMode {
  return value === TabUIEditorMode.ViewOnly
    ? TabUIEditorMode.ViewOnly
    : TabUIEditorMode.Edit;
}

function resolveScorePanelPlacement(
  value: string | null
): TabUIScorePanelPlacement {
  return value === TabUIScorePanelPlacement.Bottom
    ? TabUIScorePanelPlacement.Bottom
    : TabUIScorePanelPlacement.Top;
}

function resolveSidePanelPlacement(
  value: string | null
): TabUISidePanelPlacement {
  return value === TabUISidePanelPlacement.Right
    ? TabUISidePanelPlacement.Right
    : TabUISidePanelPlacement.Left;
}

function resolvePanelVisibility(value: string | null): DemoPanelVisibility {
  return value === "visible" || value === "hidden" ? value : "default";
}

function visibilityOverride(value: DemoPanelVisibility): boolean | undefined {
  return value === "default" ? undefined : value === "visible";
}

function applyConfigControlValues(params: URLSearchParams): void {
  interactionModeSelect.value = resolveInteractionMode(params.get("mode"));
  scorePanelVisibilitySelect.value = resolvePanelVisibility(
    params.get("scorePanel")
  );
  scorePanelPlacementSelect.value = resolveScorePanelPlacement(
    params.get("scorePanelPlacement")
  );
  sidePanelVisibilitySelect.value = resolvePanelVisibility(
    params.get("sidePanel")
  );
  sidePanelPlacementSelect.value = resolveSidePanelPlacement(
    params.get("sidePanelPlacement")
  );
  sidePanelCollapsibleSelect.value =
    params.get("sidePanelCollapsible") === "false" ? "false" : "true";
  sidePanelCollapsedSelect.value =
    params.get("sidePanelCollapsed") === "true" ? "true" : "false";
  syncSideCollapseControl();
}

function syncSideCollapseControl(): void {
  const collapsible = sidePanelCollapsibleSelect.value === "true";
  sidePanelCollapsedSelect.disabled = !collapsible;
  if (!collapsible) {
    sidePanelCollapsedSelect.value = "false";
  }
}

function persistConfigControlValues(): void {
  const params = new URLSearchParams(window.location.search);
  params.set("mode", interactionModeSelect.value);
  params.set("scorePanel", scorePanelVisibilitySelect.value);
  params.set("scorePanelPlacement", scorePanelPlacementSelect.value);
  params.set("sidePanel", sidePanelVisibilitySelect.value);
  params.set("sidePanelPlacement", sidePanelPlacementSelect.value);
  params.set("sidePanelCollapsible", sidePanelCollapsibleSelect.value);
  params.set("sidePanelCollapsed", sidePanelCollapsedSelect.value);
  window.history.replaceState(null, "", `?${params.toString()}`);
}

applyConfigControlValues(searchParams);
applyEditorThemeToPage(selectedThemeConfig);
if (selectedFixture === "performance_stress") {
  console.log("=== PERF MODE ===", "Performance stress score enabled");
}

if (fixtureSelect !== null) {
  fixtureSelect.replaceChildren();
  for (const fixture of getEditorFixtures()) {
    const option = document.createElement("option");
    option.value = fixture.key;
    option.textContent = fixture.label;
    option.selected = fixture.key === selectedFixture;
    fixtureSelect.appendChild(option);
  }
}

if (themeSelect !== null) {
  themeSelect.replaceChildren();
  const darkThemes = getEditorThemes().filter((t) => t.isDark);
  const lightThemes = getEditorThemes().filter((t) => !t.isDark);
  for (const theme of darkThemes) {
    const option = document.createElement("option");
    option.value = theme.key;
    option.textContent = theme.label;
    option.selected = theme.key === selectedTheme;
    themeSelect.appendChild(option);
  }
  const separator = document.createElement("option");
  separator.disabled = true;
  separator.textContent = "--- Light themes ---";
  themeSelect.appendChild(separator);
  for (const theme of lightThemes) {
    const option = document.createElement("option");
    option.value = theme.key;
    option.textContent = theme.label;
    option.selected = theme.key === selectedTheme;
    themeSelect.appendChild(option);
  }
}

function navigateWithSelection(fixtureKey: string, themeKey: string): void {
  const params = new URLSearchParams(window.location.search);
  params.set("fixture", fixtureKey);
  params.set("theme", themeKey);
  window.location.search = params.toString();
}

function handleFixtureChange(): void {
  navigateWithSelection(
    fixtureSelect?.value ?? selectedFixture,
    themeSelect?.value ?? selectedTheme
  );
}

function handleThemeChange(): void {
  navigateWithSelection(
    fixtureSelect?.value ?? selectedFixture,
    themeSelect?.value ?? selectedTheme
  );
}

fixtureSelect?.addEventListener("change", handleFixtureChange);
themeSelect?.addEventListener("change", handleThemeChange);

const baseEditorConfig = {
  ...selectedThemeConfig,
  playback: {
    [ElectricGuitarTone.Clean]: {
      url: CLEAN_GUITAR_SAMPLE_URL,
      rootNote: {
        noteValue: NoteValue.C,
        octave: 3,
      },
    },
    [ElectricGuitarTone.Overdrive]: {
      url: OVERDRIVEN_GUITAR_SAMPLE_URL,
      rootNote: {
        noteValue: NoteValue.C,
        octave: 3,
      },
    },
    [ElectricGuitarTone.Distortion]: {
      url: DISTORTED_GUITAR_SAMPLE_URL,
      rootNote: {
        noteValue: NoteValue.C,
        octave: 3,
      },
    },
    [BassGuitarTone.Clean]: {
      url: SLAP_BASS_SAMPLE_URL,
      rootNote: {
        noteValue: NoteValue.C,
        octave: 2,
      },
    },
    [AcousticGuitarTone.Nylon]: {
      url: NYLON_GUITAR_SAMPLE_URL,
      rootNote: {
        noteValue: NoteValue.C,
        octave: 4,
      },
    },
    [AcousticGuitarTone.Steel]: {
      url: STEEL_GUITAR_SAMPLE_URL,
      rootNote: {
        noteValue: NoteValue.C,
        octave: 4,
      },
    },
  },
};

function createEditorConfig(): TabUIConfig {
  const scoreVisibility = visibilityOverride(
    resolvePanelVisibility(scorePanelVisibilitySelect.value)
  );
  const sideVisibility = visibilityOverride(
    resolvePanelVisibility(sidePanelVisibilitySelect.value)
  );

  return {
    ...baseEditorConfig,
    interaction: {
      mode: resolveInteractionMode(interactionModeSelect.value),
    },
    panels: {
      score: {
        ...(scoreVisibility === undefined ? {} : { visible: scoreVisibility }),
        placement: resolveScorePanelPlacement(scorePanelPlacementSelect.value),
      },
      side: {
        ...(sideVisibility === undefined ? {} : { visible: sideVisibility }),
        placement: resolveSidePanelPlacement(sidePanelPlacementSelect.value),
        collapsible: sidePanelCollapsibleSelect.value === "true",
        initiallyCollapsed: sidePanelCollapsedSelect.value === "true",
      },
    },
  };
}

function mountEditor(score: Score, config: TabUIConfig): TabUIEditor {
  const editor = new TabUIEditor(rootDiv, score, config);
  editor.init();
  return editor;
}

let activeEditorConfig = createEditorConfig();
let tabuiEditor = mountEditor(selectedScore, activeEditorConfig);

function replaceMountedEditor(score: Score, config: TabUIConfig): void {
  const previousScore = tabuiEditor.score;
  const previousConfig = activeEditorConfig;
  tabuiEditor.dispose();
  try {
    tabuiEditor = mountEditor(score, config);
    activeEditorConfig = config;
  } catch (error) {
    tabuiEditor = mountEditor(previousScore, previousConfig);
    throw error;
  }
}

function handleEditorConfigChange(): void {
  const previousParams = new URLSearchParams(window.location.search);
  syncSideCollapseControl();
  try {
    replaceMountedEditor(tabuiEditor.score, createEditorConfig());
    persistConfigControlValues();
  } catch (error) {
    applyConfigControlValues(previousParams);
    throw error;
  }
}

const editorConfigControls = [
  interactionModeSelect,
  scorePanelVisibilitySelect,
  scorePanelPlacementSelect,
  sidePanelVisibilitySelect,
  sidePanelPlacementSelect,
  sidePanelCollapsibleSelect,
  sidePanelCollapsedSelect,
];
for (const control of editorConfigControls) {
  control.addEventListener("change", handleEditorConfigChange);
}

function handleResetDemoSettings(): void {
  window.location.search = "";
}

resetDemoSettingsButton.addEventListener("click", handleResetDemoSettings);

const unbindPersistenceControls = bindScorePersistenceControls({
  serializeButton,
  deserializeButton,
  fileInput: scoreFileInput,
  status: persistenceStatus,
  getScore: () => tabuiEditor.score,
  replaceScore: (score) => {
    replaceMountedEditor(score, activeEditorConfig);
  },
  downloadDocument: downloadScoreDocument,
});

import.meta.hot?.dispose(() => {
  fixtureSelect?.removeEventListener("change", handleFixtureChange);
  themeSelect?.removeEventListener("change", handleThemeChange);
  for (const control of editorConfigControls) {
    control.removeEventListener("change", handleEditorConfigChange);
  }
  resetDemoSettingsButton.removeEventListener("click", handleResetDemoSettings);
  unbindPersistenceControls();
  tabuiEditor.dispose();
});
