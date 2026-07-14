import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";

export const TEST_LAYOUT_DIMENSIONS = new EditorLayoutDimensions({
  width: 1200,
  noteTextSize: 12,
  timeSigTextSize: 48,
  tempoTextSize: 24,
  durationsHeight: 30,
  horizontalPadding: 12,
});

export function createTestLayoutDimensions(): EditorLayoutDimensions {
  return new EditorLayoutDimensions({
    width: 1200,
    noteTextSize: 12,
    timeSigTextSize: 48,
    tempoTextSize: 24,
    durationsHeight: 30,
    horizontalPadding: 12,
  });
}
