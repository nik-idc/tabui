import { SelectionDragController } from "../../../src/notation/input/selection-drag-controller";
import { Point } from "../../../src/shared";
import { createDragScore } from "./drag-selection-fixture";

describe("SelectionDragController", () => {
  test("starts in idle state and idle moves are no-ops", () => {
    const controller = new SelectionDragController();
    const {
      elements: [beatElement],
    } = createDragScore();

    expect(controller.isDragPending).toBe(false);
    expect(controller.isSelectingBeats).toBe(false);
    expect(controller.handleMove(new Point(10, 10), beatElement, 1)).toEqual({
      shouldSelectCurrentBeat: false,
      startedSelection: false,
    });
  });

  test("begin enters drag-pending state", () => {
    const controller = new SelectionDragController();

    const {
      elements: [beatElement],
    } = createDragScore();
    controller.begin(beatElement, new Point(0, 0), 1);

    expect(controller.isDragPending).toBe(true);
    expect(controller.isSelectingBeats).toBe(false);
  });

  test("movement below the fixed threshold keeps drag pending", () => {
    const controller = new SelectionDragController();
    const {
      elements: [anchorBeat],
    } = createDragScore();

    anchorBeat.boundingBox.width = 8;
    controller.begin(anchorBeat, new Point(0, 0), 1);

    expect(controller.handleMove(new Point(5.9, 0), anchorBeat, 1)).toEqual({
      shouldSelectCurrentBeat: false,
      startedSelection: false,
    });
    expect(controller.isDragPending).toBe(true);
    expect(controller.isSelectingBeats).toBe(false);
  });

  test("movement at the fixed threshold starts selection", () => {
    const controller = new SelectionDragController();
    const {
      elements: [anchorBeat, currentBeat],
    } = createDragScore();

    currentBeat.boundingBox.width = 120;
    controller.begin(anchorBeat, new Point(0, 0), 1);

    const thresholdPoint = new Point(6, 0);
    expect(controller.handleMove(thresholdPoint, currentBeat, 1)).toEqual({
      shouldSelectCurrentBeat: true,
      startedSelection: true,
      anchorBeat,
    });
    expect(controller.isDragPending).toBe(false);
    expect(controller.isSelectingBeats).toBe(true);
  });

  test("subsequent moves while selecting continue selecting without restarting", () => {
    const controller = new SelectionDragController();
    const {
      elements: [anchorBeat, currentBeat],
    } = createDragScore();

    controller.begin(anchorBeat, new Point(0, 0), 1);
    controller.handleMove(new Point(12, 0), currentBeat, 1);

    expect(controller.handleMove(new Point(20, 5), currentBeat, 1)).toEqual({
      shouldSelectCurrentBeat: true,
      startedSelection: false,
    });
    expect(controller.isDragPending).toBe(false);
    expect(controller.isSelectingBeats).toBe(true);
  });

  test("reset returns the controller to idle state", () => {
    const controller = new SelectionDragController();
    const {
      elements: [anchorBeat],
    } = createDragScore();

    controller.begin(anchorBeat, new Point(0, 0), 1);
    controller.handleMove(new Point(12, 0), anchorBeat, 1);

    controller.reset();

    expect(controller.isDragPending).toBe(false);
    expect(controller.isSelectingBeats).toBe(false);
    expect(controller.handleMove(new Point(100, 100), anchorBeat, 1)).toEqual({
      shouldSelectCurrentBeat: false,
      startedSelection: false,
    });
  });

  test("ignores non-owning pointers and only finishes for the owner", () => {
    const controller = new SelectionDragController();
    const {
      elements: [beatElement],
    } = createDragScore();

    controller.begin(beatElement, new Point(0, 0), 4);

    expect(controller.handleMove(new Point(20, 0), beatElement, 5)).toEqual({
      shouldSelectCurrentBeat: false,
      startedSelection: false,
    });
    expect(controller.isDragPending).toBe(true);
    expect(controller.finish(5)).toBe(false);
    expect(controller.isDragPending).toBe(true);
    expect(controller.finish(4)).toBe(true);
    expect(controller.isDragPending).toBe(false);
  });
});
