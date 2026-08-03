import { deserializeScore, Score, serializeScore } from "../src/notation/model";

export type ScorePersistenceControlsOptions = {
  serializeButton: HTMLButtonElement;
  deserializeButton: HTMLButtonElement;
  fileInput: HTMLInputElement;
  status: HTMLElement;
  getScore: () => Score;
  replaceScore: (score: Score) => void;
  downloadDocument: (contents: string, filename: string) => void;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown persistence error";
}

function scoreFilename(score: Score): string {
  const name = score.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${name || "tabui-score"}.tabui.json`;
}

export function downloadScoreDocument(
  contents: string,
  filename: string
): void {
  const url = URL.createObjectURL(
    new Blob([contents], { type: "application/json" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
  const showStatus = (message: string, isError = false): void => {
    status.textContent = message;
    status.dataset.state = isError ? "error" : "success";
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
  const onDeserialize = (): void => fileInput.click();
  const onFileSelected = async (): Promise<void> => {
    const file = fileInput.files?.[0];
    if (file === undefined) {
      return;
    }
    try {
      const document: unknown = JSON.parse(await file.text());
      replaceScore(deserializeScore(document));
      showStatus(`Mounted score from ${file.name}.`);
    } catch (error) {
      showStatus(errorMessage(error), true);
      console.error(error);
    } finally {
      fileInput.value = "";
    }
  };

  serializeButton.addEventListener("click", onSerialize);
  deserializeButton.addEventListener("click", onDeserialize);
  fileInput.addEventListener("change", onFileSelected);

  return () => {
    serializeButton.removeEventListener("click", onSerialize);
    deserializeButton.removeEventListener("click", onDeserialize);
    fileInput.removeEventListener("change", onFileSelected);
  };
}
