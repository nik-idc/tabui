import { TabUIEditor } from "@/tabui-editor";
import { EditorLayoutDimensions } from "@/notation";
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
if (selectedFixture === "selection_perf") {
  console.log("=== PERF MODE ===", "Selection stress score enabled");
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

const tabuiEditor = new TabUIEditor(
  rootDiv,
  selectedScore,
  selectedThemeConfig
);
tabuiEditor.init();
