import { TabLayoutDimensions } from "../../src/notation/controller/tab-layout-dimensions";

export function ensureLayoutConfigured(): void {
  try {
    TabLayoutDimensions.configure({
      width: 1200,
      noteTextSize: 12,
      timeSigTextSize: 48,
      tempoTextSize: 24,
      durationsHeight: 30,
    });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== "Layout dimensions already configured"
    ) {
      throw error;
    }
  }
}
