import { SVGTechniqueLabelRenderer } from "../../../src/notation/render/svg/svg-technique-label-renderer";
import { GuitarTechniqueType } from "../../../src/notation/model";

function fakeElement(tagName: string): any {
  const attributes = new Map<string, string>();
  const children: any[] = [];
  const listeners = new Map<string, EventListener>();
  return {
    tagName,
    children,
    parentNode: undefined,
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    getAttribute: (name: string) => attributes.get(name) ?? null,
    appendChild: (child: any) => {
      children.push(child);
      return child;
    },
    removeChild: (child: any) => {
      children.splice(children.indexOf(child), 1);
      child.parentNode = undefined;
    },
    addEventListener: (type: string, listener: EventListener) =>
      listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
    getBBox: () => ({ x: 10, y: 20, width: 30, height: 8 }),
    attributes,
    listeners,
  };
}

function setupRenderer() {
  const previousDocument = globalThis.document;
  (globalThis as any).document = {
    createElementNS: (_namespace: string, tagName: string) =>
      fakeElement(tagName),
  };
  const element = {
    technique: { uuid: "technique", type: GuitarTechniqueType.PalmMute },
    pathDescriptors: [{ d: "M 0 0 L 10 0", attrs: {} }],
    textDescriptors: [{ text: "tap", attrs: {} }],
    descriptorOriginBarLocal: { x: 4, y: 5 },
  } as any;
  const renderer = new SVGTechniqueLabelRenderer(
    { trackElement: { layoutDimensions: { NOTE_TEXT_SIZE: 16 } } } as any,
    element,
    {} as any
  );
  return { previousDocument, renderer, element };
}

test("label callbacks use the current element and are replaced", () => {
  const { previousDocument, renderer, element } = setupRenderer();
  try {
    const first = jest.fn();
    const second = jest.fn();
    renderer.attachMouseEvent("click", first);
    renderer.attachMouseEvent("click", second);
    renderer.updateElementReference({ ...element } as any);
    const listener = (renderer.ensureContainerGroup() as any).listeners.get(
      "click"
    );
    const event = { type: "click" } as Event;
    listener(event);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(event, renderer.techniqueLabelElement);
  } finally {
    (globalThis as any).document = previousDocument;
  }
});

test("label hit targets follow descriptors and are cleaned up", () => {
  const { previousDocument, renderer, element } = setupRenderer();
  try {
    renderer.render();
    const container = renderer.ensureContainerGroup() as any;
    const hitPath = container.children.find((child: any) =>
      child.attributes.get("id")?.startsWith("technique-label-hit-path")
    );
    const hitText = container.children.find((child: any) =>
      child.attributes.get("id")?.startsWith("technique-label-hit-text")
    );
    expect(hitPath.attributes.get("stroke-width")).toBe("8");
    expect(hitPath.attributes.get("d")).toBe(element.pathDescriptors[0].d);
    expect(hitText.attributes.get("d")).toBe("M 8 18 H 42 V 30 H 8 Z");

    element.pathDescriptors = [{ d: "M 0 0 L 20 0", attrs: {} }];
    renderer.render();
    const updatedHitPath = container.children.find((child: any) =>
      child.attributes.get("id")?.startsWith("technique-label-hit-path")
    );
    expect(updatedHitPath).toBe(hitPath);
    expect(updatedHitPath.attributes.get("d")).toBe("M 0 0 L 20 0");

    element.technique.type = GuitarTechniqueType.Bend;
    renderer.render();
    expect(container.attributes.get("class")).toBe("tu-technique-label");
    expect(container.children).toHaveLength(1);

    element.pathDescriptors = [];
    element.textDescriptors = [];
    renderer.render();
    expect(container.children).toHaveLength(1);
    renderer.unrender();
    expect(container.children).toHaveLength(0);
  } finally {
    (globalThis as any).document = previousDocument;
  }
});
