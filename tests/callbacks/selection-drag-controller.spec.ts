import { SelectionDragController } from "../../src/callbacks/editor/selection-drag-controller";
import { Point } from "../../src/shared";

function createBeatElement(width: number = 40) {
  return {
    boundingBox: {
      width,
    },
    rect: {
      width,
    },
  } as any;
}

describe("SelectionDragController", () => {
  test("starts in idle state and idle moves are no-ops", () => {
    const controller = new SelectionDragController();
    const beatElement = createBeatElement();

    expect(controller.isDragPending).toBe(false);
    expect(controller.isSelectingBeats).toBe(false);
    expect(controller.handleMove(new Point(10, 10), beatElement)).toEqual({
      shouldSelectCurrentBeat: false,
      startedSelection: false,
    });
  });

  test("begin enters drag-pending state", () => {
    const controller = new SelectionDragController();

    controller.begin(createBeatElement(), new Point(0, 0));

    expect(controller.isDragPending).toBe(true);
    expect(controller.isSelectingBeats).toBe(false);
  });

  test("move below threshold keeps drag pending and does not start selection", () => {
    const controller = new SelectionDragController();
    const anchorBeat = createBeatElement(40);

    controller.begin(anchorBeat, new Point(0, 0));

    expect(controller.handleMove(new Point(9, 0), anchorBeat)).toEqual({
      shouldSelectCurrentBeat: false,
      startedSelection: false,
    });
    expect(controller.isDragPending).toBe(true);
    expect(controller.isSelectingBeats).toBe(false);
  });

  test("move at threshold starts selection and returns the anchor beat", () => {
    const controller = new SelectionDragController();
    const anchorBeat = createBeatElement(40);
    const currentBeat = createBeatElement(40);

    controller.begin(anchorBeat, new Point(0, 0));

    expect(controller.handleMove(new Point(10, 0), currentBeat)).toEqual({
      shouldSelectCurrentBeat: true,
      startedSelection: true,
      anchorBeat,
    });
    expect(controller.isDragPending).toBe(false);
    expect(controller.isSelectingBeats).toBe(true);
  });

  test("subsequent moves while selecting continue selecting without restarting", () => {
    const controller = new SelectionDragController();
    const anchorBeat = createBeatElement(40);
    const currentBeat = createBeatElement(40);

    controller.begin(anchorBeat, new Point(0, 0));
    controller.handleMove(new Point(10, 0), currentBeat);

    expect(controller.handleMove(new Point(20, 5), currentBeat)).toEqual({
      shouldSelectCurrentBeat: true,
      startedSelection: false,
    });
    expect(controller.isDragPending).toBe(false);
    expect(controller.isSelectingBeats).toBe(true);
  });

  test("reset returns the controller to idle state", () => {
    const controller = new SelectionDragController();
    const anchorBeat = createBeatElement(40);

    controller.begin(anchorBeat, new Point(0, 0));
    controller.handleMove(new Point(10, 0), anchorBeat);

    controller.reset();

    expect(controller.isDragPending).toBe(false);
    expect(controller.isSelectingBeats).toBe(false);
    expect(controller.handleMove(new Point(100, 100), anchorBeat)).toEqual({
      shouldSelectCurrentBeat: false,
      startedSelection: false,
    });
  });
});
