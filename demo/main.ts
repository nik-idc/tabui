import { TabUIEditor } from "../src/tabui-editor";
import "../src/styles.scss";
import {
  AcousticGuitarTone,
  BassGuitarTone,
  EditorLayoutDimensions,
  ElectricGuitarTone,
  NoteValue,
} from "../src/notation";
import {
  getEditorFixtures,
  resolveEditorFixture,
  resolveEditorFixtureKey,
} from "./data/fixture";
import {
  getEditorThemes,
  resolveEditorTheme,
  resolveEditorThemeKey,
} from "./data/theme";

EditorLayoutDimensions.configure({
  width: 1200,
  noteTextSize: 12,
  timeSigTextSize: 48,
  tempoTextSize: 24,
  durationsHeight: 30,
});

const CLEAN_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Alesis-Fusion-Clean-Guitar-C3.wav`;
const OVERDRIVEN_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Roland-SC-88-Overdriven-Guitar-C3.wav`;
const DISTORTED_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Roland-SC-88-Distorted-Guitar-C3.wav`;
const SLAP_BASS_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Alesis-S4-Plus-FatSynSlap-C2.wav`;
const NYLON_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Alesis-Fusion-Nylon-String-Guitar-C4.wav`;
const STEEL_GUITAR_SAMPLE_URL = `${import.meta.env.BASE_URL}samples/Alesis-Fusion-Steel-String-Guitar-C4.wav`;

const rootDiv = document.getElementById(
  "tabui-editor"
) as HTMLDivElement | null;
if (rootDiv === null) {
  throw new Error("Could not get root div element");
}
const searchParams = new URLSearchParams(window.location.search);
const fixtureSelect = document.getElementById(
  "fixture-select"
) as HTMLSelectElement | null;
const themeSelect = document.getElementById(
  "theme-select"
) as HTMLSelectElement | null;

const selectedFixture = resolveEditorFixtureKey(searchParams);
const selectedTheme = resolveEditorThemeKey(searchParams);
const selectedScore = resolveEditorFixture(searchParams);
const selectedThemeConfig = resolveEditorTheme(searchParams);
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

fixtureSelect?.addEventListener("change", () => {
  navigateWithSelection(
    fixtureSelect.value,
    themeSelect?.value ?? selectedTheme
  );
});

themeSelect?.addEventListener("change", () => {
  navigateWithSelection(
    fixtureSelect?.value ?? selectedFixture,
    themeSelect.value
  );
});

const tabuiEditor = new TabUIEditor(rootDiv, selectedScore, {
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
});
tabuiEditor.init();
