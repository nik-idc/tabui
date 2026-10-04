import { SVGTrackLineInfoRenderer } from "../../../src/notation/render/svg/svg-track-line-info-renderer";

test("tempo callbacks resolve current bars and detach before renderer reuse", () => {
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
    const oldBar = { bar: { uuid: 1 } };
    const currentBar = { bar: { uuid: 1 } };
    const target = new Target();
    const renderer = new SVGTrackLineInfoRenderer(
      {} as any,
      {
        uuid: 1,
        barTempoRectsMap: new Map([[oldBar, {}]]),
      } as any,
      {} as any
    );
    (renderer as any)._temposSVG.set(oldBar, {
      group: { contains: (element: unknown) => element === target },
    });
    const oldHandler = jest.fn();
    const handler = jest.fn();
    renderer.attachMouseEvent("click", oldHandler);
    renderer.attachMouseEvent("click", handler);
    renderer.updateElementReference({
      barTempoRectsMap: new Map([[currentBar, {}]]),
    } as any);
    const event = { target } as unknown as Event;
    listeners.get("click")!(event);
    expect(oldHandler).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(event, currentBar);
    listeners.get("click")!({ target: new Target() } as unknown as Event);
    expect(handler).toHaveBeenCalledTimes(1);
    renderer.detachContainerGroup();
    expect(listeners.size).toBe(0);
    renderer.attachMouseEvent("click", handler);
    listeners.get("click")!(event);
    expect(handler).toHaveBeenCalledTimes(2);
    renderer.detachMouseEvent("click");
    expect(listeners.size).toBe(0);
  } finally {
    (globalThis as any).Element = previousElement;
    (globalThis as any).document = previousDocument;
  }
});
