import { SVGBarRenderer } from "../../../src/notation/render/svg/svg-bar-renderer";

test("bar callbacks route each target using the current element and detach on reuse", () => {
  class Target {}
  const previousElement = globalThis.Element;
  const previousDocument = globalThis.document;
  const listeners = new Map<string, EventListener>();
  const group = {
    setAttribute: jest.fn(),
    addEventListener: (type: string, listener: EventListener) =>
      listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
  };
  (globalThis as any).Element = Target;
  (globalThis as any).document = { createElementNS: () => group };
  try {
    const renderer = new SVGBarRenderer(
      {} as any,
      { bar: { uuid: 1 } } as any,
      {} as any
    );
    const start = new Target();
    const end = new Target();
    const count = new Target();
    const signature = new Target();
    (renderer as any)._repeatStartSVG = start;
    (renderer as any)._repeatEndGroupSVG = {
      contains: (target: unknown) => target === end || target === count,
    };
    (renderer as any)._timeSigGroupSVG = {
      contains: (target: unknown) => target === signature,
    };
    const oldHandler = jest.fn();
    const handler = jest.fn();
    renderer.attachMouseEvent("click", oldHandler);
    renderer.attachMouseEvent("click", handler);
    const current = { bar: { uuid: 1 } } as any;
    renderer.updateElementReference(current);
    for (const [target, kind] of [
      [start, "repeatStart"],
      [end, "repeatEnd"],
      [count, "repeatEnd"],
      [signature, "timeSignature"],
    ]) {
      const event = { target } as unknown as Event;
      const listener = listeners.get("click");
      if (listener === undefined) throw Error("Expected click listener");
      listener(event);
      expect(handler).toHaveBeenLastCalledWith(event, current, kind);
    }
    expect(oldHandler).not.toHaveBeenCalled();
    renderer.detachContainerGroup();
    expect(listeners.size).toBe(0);
    renderer.attachMouseEvent("click", handler);
    expect(listeners.size).toBe(1);
    renderer.detachMouseEvent("click");
    expect(listeners.size).toBe(0);
  } finally {
    (globalThis as any).Element = previousElement;
    (globalThis as any).document = previousDocument;
  }
});
