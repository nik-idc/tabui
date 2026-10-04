import { SVGTechniqueRenderer } from "../../../src/notation/render/svg/svg-technique-renderer";

test("bindings use the current element and detach before reuse", () => {
  const listeners = new Map<string, EventListener>();
  const group = {
    setAttribute: jest.fn(),
    addEventListener: (type: string, listener: EventListener) => {
      listeners.set(type, listener);
    },
    removeEventListener: (type: string) => listeners.delete(type),
  };
  const previousDocument = globalThis.document;
  (globalThis as any).document = { createElementNS: () => group };
  try {
    const first = { technique: { uuid: 1 } } as any;
    const current = { technique: { uuid: 1 } } as any;
    const renderer = new SVGTechniqueRenderer({} as any, first, {} as any);
    const oldHandler = jest.fn();
    const handler = jest.fn();
    const event = { type: "click" } as Event;
    renderer.attachMouseEvent("click", oldHandler);
    renderer.attachMouseEvent("click", handler);
    renderer.updateElementReference(current);
    listeners.get("click")!(event);
    expect(oldHandler).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(event, current);

    renderer.detachContainerGroup();
    expect(listeners.size).toBe(0);
    renderer.attachMouseEvent("click", handler);
    listeners.get("click")!(event);
    expect(handler).toHaveBeenCalledTimes(2);
    renderer.detachMouseEvent("click");
    expect(listeners.size).toBe(0);
  } finally {
    (globalThis as any).document = previousDocument;
  }
});
