import { exportMusicXml, importMusicXml, Score } from "@atikincode/tabui";
import { errorMessage, scoreBaseName } from "./score-persistence-controls";

/** A file format that the demo can import from and export to. */
type ExchangeFormat = {
  /** File extension for exported files, with the dot. */
  extension: string;
  /** Media type for exported files. */
  type: string;
  /** Value for the file input's `accept` attribute. */
  accept: string;
  write: (score: Score) => string;
  read: (contents: string) => { score: Score; warnings: string[] };
};

/** Formats by the value of their option in the format selector. */
const FORMATS: Record<string, ExchangeFormat> = {
  musicxml: {
    extension: ".musicxml",
    type: "application/vnd.recordare.musicxml+xml",
    accept: ".musicxml,.xml,application/vnd.recordare.musicxml+xml",
    write: exportMusicXml,
    read: importMusicXml,
  },
};

export type ScoreExchangeControlsOptions = {
  formatSelect: HTMLSelectElement;
  importButton: HTMLButtonElement;
  exportButton: HTMLButtonElement;
  fileInput: HTMLInputElement;
  status: HTMLElement;
  getScore: () => Score;
  replaceScore: (score: Score) => void;
  downloadDocument: (contents: string, filename: string, type: string) => void;
};

/**
 * Binds the Import and Export buttons, which read and write the format chosen
 * in the format selector. Returns a function that unbinds them.
 */
export function bindScoreExchangeControls({
  formatSelect,
  importButton,
  exportButton,
  fileInput,
  status,
  getScore,
  replaceScore,
  downloadDocument,
}: ScoreExchangeControlsOptions): () => void {
  let isActive = true;
  let readGeneration = 0;
  let isReading = false;
  const getFormat = (): ExchangeFormat =>
    FORMATS[formatSelect.value] ?? FORMATS.musicxml;
  const showStatus = (message: string, isError = false): void => {
    status.textContent = message;
    status.dataset.state = isError ? "error" : "success";
  };
  const setReading = (reading: boolean): void => {
    isReading = reading;
    importButton.disabled = reading;
    status.setAttribute("aria-busy", String(reading));
  };

  const onExport = (): void => {
    try {
      const format = getFormat();
      const score = getScore();
      const filename = `${scoreBaseName(score)}${format.extension}`;
      downloadDocument(format.write(score), filename, format.type);
      showStatus(`Downloaded ${filename}.`);
    } catch (error) {
      showStatus(errorMessage(error), true);
      console.error(error);
    }
  };
  const onImport = (): void => {
    if (isReading) {
      return;
    }
    fileInput.accept = getFormat().accept;
    fileInput.click();
  };
  const onFileSelected = async (): Promise<void> => {
    const file = fileInput.files?.[0];
    if (file === undefined) {
      return;
    }
    const format = getFormat();
    const generation = ++readGeneration;
    setReading(true);
    try {
      const contents = await file.text();
      if (!isActive || generation !== readGeneration) {
        return;
      }
      const { score, warnings } = format.read(contents);
      replaceScore(score);
      showStatus([`Imported ${file.name}.`, ...warnings].join(" "));
    } catch (error) {
      if (!isActive || generation !== readGeneration) {
        return;
      }
      showStatus(errorMessage(error), true);
      console.error(error);
    } finally {
      if (isActive && generation === readGeneration) {
        fileInput.value = "";
        setReading(false);
      }
    }
  };

  exportButton.addEventListener("click", onExport);
  importButton.addEventListener("click", onImport);
  fileInput.addEventListener("change", onFileSelected);

  return () => {
    if (!isActive) {
      return;
    }
    isActive = false;
    readGeneration++;
    setReading(false);
    exportButton.removeEventListener("click", onExport);
    importButton.removeEventListener("click", onImport);
    fileInput.removeEventListener("change", onFileSelected);
  };
}
