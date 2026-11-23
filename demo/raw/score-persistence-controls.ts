import { deserializeScore, Score, serializeScore } from "@atikincode/tabui";

export type ScorePersistenceControlsOptions = {
  serializeButton: HTMLButtonElement;
  deserializeButton: HTMLButtonElement;
  fileInput: HTMLInputElement;
  status: HTMLElement;
  getScore: () => Score;
  replaceScore: (score: Score) => void;
  downloadDocument: (contents: string, filename: string) => void;
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown persistence error";
}

/** Returns a file name for the score, without an extension. */
export function scoreBaseName(score: Score): string {
  const name = score.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return name || "tabui-score";
}

function scoreFilename(score: Score): string {
  return `${scoreBaseName(score)}.tabui.json`;
}

/** Downloads text as a file. The type defaults to JSON. */
export function downloadScoreDocument(
  contents: string,
  filename: string,
  type = "application/json"
): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  let anchor: HTMLAnchorElement | undefined;
  try {
    anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor?.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export function bindScorePersistenceControls({
  serializeButton,
  deserializeButton,
  fileInput,
  status,
  getScore,
  replaceScore,
  downloadDocument,
}: ScorePersistenceControlsOptions): () => void {
  let active = true;
  let readGeneration = 0;
  let isReading = false;
  const showStatus = (message: string, isError = false): void => {
    status.textContent = message;
    status.dataset.state = isError ? "error" : "success";
  };
  const setReading = (reading: boolean): void => {
    isReading = reading;
    deserializeButton.disabled = reading;
    status.setAttribute("aria-busy", String(reading));
  };
  const onSerialize = (): void => {
    try {
      const score = getScore();
      const contents = JSON.stringify(serializeScore(score), null, 2);
      downloadDocument(contents, scoreFilename(score));
      showStatus(`Downloaded ${scoreFilename(score)}.`);
    } catch (error) {
      showStatus(errorMessage(error), true);
      console.error(error);
    }
  };
  const onDeserialize = (): void => {
    if (!isReading) {
      fileInput.click();
    }
  };
  const onFileSelected = async (): Promise<void> => {
    const file = fileInput.files?.[0];
    if (file === undefined) {
      return;
    }
    const generation = ++readGeneration;
    setReading(true);
    try {
      const contents = await file.text();
      if (!active || generation !== readGeneration) {
        return;
      }
      const document: unknown = JSON.parse(contents);
      replaceScore(deserializeScore(document));
      showStatus(`Mounted score from ${file.name}.`);
    } catch (error) {
      if (!active || generation !== readGeneration) {
        return;
      }
      showStatus(errorMessage(error), true);
      console.error(error);
    } finally {
      if (active && generation === readGeneration) {
        fileInput.value = "";
        setReading(false);
      }
    }
  };

  serializeButton.addEventListener("click", onSerialize);
  deserializeButton.addEventListener("click", onDeserialize);
  fileInput.addEventListener("change", onFileSelected);

  return () => {
    if (!active) {
      return;
    }
    active = false;
    readGeneration++;
    setReading(false);
    serializeButton.removeEventListener("click", onSerialize);
    deserializeButton.removeEventListener("click", onDeserialize);
    fileInput.removeEventListener("change", onFileSelected);
  };
}
