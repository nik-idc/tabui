import { NoteDuration } from "../../../src/notation/model";
import { NoteControlsTemplateRenderer } from "../../../src/ui/side-controls/note-controls/note-controls-template-renderer";
import { createBarWithBeats } from "../model/helpers";

function createButton() {
  const classes = new Set<string>();
  return {
    classes,
    dataset: {} as Record<string, string>,
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
    },
    setAttribute: jest.fn(),
  } as unknown as HTMLImageElement;
}

describe("NoteControlsTemplateRenderer", () => {
  test("highlights the selected note's beat controls", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        dots: 2,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    const durationButtons = Array.from({ length: 7 }, createButton);
    const dot1Button = createButton();
    const dot2Button = createButton();
    const tuplet2Button = createButton();
    const tuplet3Button = createButton();
    const tupletButton = createButton();
    const renderer = Object.assign(
      Object.create(NoteControlsTemplateRenderer.prototype),
      {
        notationComponent: {
          trackController: {
            selectionAsBeats: [beats[0]],
            selectionCursor: { beat: beats[0] },
          },
        },
        template: {
          durationButtons,
          restButton: createButton(),
          dot1Button,
          dot2Button,
          tuplet2Button,
          tuplet3Button,
          tupletButton,
        },
        assetsPath: { baseUrl: "", variant: "light" },
      }
    );

    const renderDurations = (
      NoteControlsTemplateRenderer.prototype as unknown as {
        renderDurationButtons(): void;
      }
    ).renderDurationButtons;
    renderDurations.call(renderer);

    const renderDots = (
      NoteControlsTemplateRenderer.prototype as unknown as {
        renderDotButtons(): void;
      }
    ).renderDotButtons;
    renderDots.call(renderer);

    const renderTuplets = (
      NoteControlsTemplateRenderer.prototype as unknown as {
        renderTupletButtons(): void;
      }
    ).renderTupletButtons;
    renderTuplets.call(renderer);

    expect(
      (durationButtons[3] as unknown as { classes: Set<string> }).classes.has(
        "tu-applied-img"
      )
    ).toBe(true);
    expect(
      (dot2Button as unknown as { classes: Set<string> }).classes.has(
        "tu-applied-img"
      )
    ).toBe(true);
    expect(
      (tuplet3Button as unknown as { classes: Set<string> }).classes.has(
        "tu-applied-img"
      )
    ).toBe(true);
  });
});
