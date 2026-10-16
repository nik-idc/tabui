import { SVGBeamSegmentRenderer } from "../../../src/notation/render/svg/svg-beam-segment-renderer";

test("bindings use the current segment and detach before reuse", () => {
  const listeners = new Map<string, EventListener>();
  const group = {
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    addEventListener: (type: string, listener: EventListener) => {
      listeners.set(type, listener);
    },
    removeEventListener: (type: string) => listeners.delete(type),
  };
  const previousDocument = globalThis.document;
  (globalThis as any).document = {
    createElementNS: () => group,
  };
  try {
    const first = { uuid: 1 } as any;
    const current = { uuid: 1 } as any;
    const renderer = new SVGBeamSegmentRenderer({} as any, first, {} as any);
    const oldHandler = jest.fn();
    const handler = jest.fn();
    const event = { type: "click" } as Event;
    renderer.attachMouseEvent("click", oldHandler);
    renderer.attachMouseEvent("click", handler);
    renderer.updateElementReference(current);
    const listener = listeners.get("click");
    if (listener !== undefined) {
      listener(event);
    }
    expect(oldHandler).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(event, current);

    renderer.detachContainerGroup();
    expect(listeners.size).toBe(0);
  } finally {
    (globalThis as any).document = previousDocument;
  }
});
