import { SVGTabBeatRhythmRenderer } from "../../../src/notation/render/svg/svg-tab-beat-rhythm-renderer";

test("rhythm callbacks route duration and dots and use the current element", () => {
  class Target {
    contains(value: unknown): boolean {
      return value === this;
    }
  }
  const previousElement = globalThis.Element;
  const previousDocument = globalThis.document;
  const listeners = new Map<string, EventListener>();
  const group = {
    setAttribute: jest.fn(),
    addEventListener: (type: string, listener: EventListener) =>
      listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
    appendChild: jest.fn(),
  };
  (globalThis as any).Element = Target;
  (globalThis as any).document = { createElementNS: () => group };
  try {
    const renderer = new SVGTabBeatRhythmRenderer(
      {} as any,
      { beat: { uuid: 1 } } as any,
      {} as any
    );
    const duration = new Target();
    const dots = new Target();
    (renderer as any)._containerGroupSVG = group;
    (renderer as any)._durationGroupSVG = duration;
    (renderer as any)._dotsGroupSVG = dots;
    const handler = jest.fn();
    renderer.attachMouseEvent("click", handler);
    const current = { beat: { uuid: 2 } } as any;
    renderer.updateElementReference(current);
    for (const [target, kind] of [
      [duration, "duration"],
      [dots, "dots"],
    ]) {
      const event = { target } as unknown as Event;
      const listener = listeners.get("click");
      if (listener === undefined) throw Error("Expected click listener");
      listener(event);
      expect(handler).toHaveBeenLastCalledWith(event, current, kind);
    }
    renderer.detachContainerGroup();
    expect(listeners.size).toBe(0);
  } finally {
    (globalThis as any).Element = previousElement;
    (globalThis as any).document = previousDocument;
  }
});
