/** True when the browser has the Clipboard API, for example on HTTPS. */
function clipboardAvailable(): boolean {
  return "clipboard" in navigator;
}

/**
 * True when the browser refused access, for example because the user denied
 * it or the host iframe does not allow it. Callers rethrow other errors,
 * because those are bugs.
 */
function isAccessDenied(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

/** Writes text with the Clipboard API. Returns false when the browser blocks the write. */
export async function writeClipboardText(text: string): Promise<boolean> {
  if (!clipboardAvailable()) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    if (isAccessDenied(error)) {
      return false;
    }
    throw error;
  }
}

/** Reads text with the Clipboard API. Returns undefined when the browser blocks the read. */
export async function readClipboardText(): Promise<string | undefined> {
  if (!clipboardAvailable()) {
    return undefined;
  }
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    if (isAccessDenied(error)) {
      return undefined;
    }
    throw error;
  }
}
