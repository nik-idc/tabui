import { ContainedDialog } from "../../../src/shared/hmtl/contained-dialog";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";

/** Minimal DOM double; browser tests cover focus, inert, and announcer order. */
class DialogElement extends EventTarget {
  attributes = new Map<string, string>();
  dataset = {};
  classList = { add: jest.fn() };
  children: DialogElement[] = [];
  parentElement?: DialogElement;
  isConnected = true;
  inert = false;
  focus = jest.fn();
  querySelectorAll = () => [];
  setAttribute = (name: string, value: string) => {
    this.attributes.set(name, value);
  };
  hasAttribute = (name: string) => this.attributes.has(name);
  removeAttribute = (name: string) => this.attributes.delete(name);
  appendChild = (child: DialogElement) => {
    this.children.push(child);
    child.parentElement = this;
    return child;
  };
}

describe("contained dialog ownership", () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document"
  );
  const originalHTMLElement = Object.getOwnPropertyDescriptor(
    globalThis,
    "HTMLElement"
  );

  beforeEach(() => {
    Object.defineProperty(globalThis, "HTMLElement", {
      configurable: true,
      value: DialogElement,
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => new DialogElement(),
        activeElement: new DialogElement(),
      },
    });
  });

  afterEach(() => {
    if (originalDocument) {
      Object.defineProperty(globalThis, "document", originalDocument);
    } else {
      Reflect.deleteProperty(globalThis, "document");
    }
    if (originalHTMLElement) {
      Object.defineProperty(globalThis, "HTMLElement", originalHTMLElement);
    } else {
      Reflect.deleteProperty(globalThis, "HTMLElement");
    }
  });

  test.each(["show", "showModal"] as const)(
    "%s owns its host until closed, without repeated-show side effects",
    (mode) => {
      const root = new DialogElement();
      const host = root.appendChild(new DialogElement());
      const mount = jest.fn();
      const enforcer = new DialogEnforcer(
        host as unknown as HTMLDivElement,
        mount
      );
      const firstElement = new DialogElement();
      const secondElement = new DialogElement();
      const first = new ContainedDialog(
        firstElement as unknown as HTMLDivElement,
        enforcer
      );
      const second = new ContainedDialog(
        secondElement as unknown as HTMLDivElement,
        enforcer
      );

      first[mode]();
      mount.mockClear();
      firstElement.focus.mockClear();
      first[mode]();
      expect(firstElement.focus).not.toHaveBeenCalled();
      expect(mount).not.toHaveBeenCalled();
      const otherMode = mode === "show" ? "showModal" : "show";
      expect(() => first[otherMode]()).toThrow(
        expect.objectContaining({
          name: "InvalidStateError",
          message: "The dialog is already open in a different mode.",
        })
      );

      for (const open of ["show", "showModal", "open"] as const) {
        expect(() => {
          if (open === "open") second.open = true;
          else second[open]();
        }).toThrow(expect.objectContaining({ name: "InvalidStateError" }));
      }
      expect(mount).not.toHaveBeenCalled();
      expect(second.open).toBe(false);
      expect(secondElement.focus).not.toHaveBeenCalled();
      expect(secondElement.dataset).toEqual({});
      expect(enforcer.activeDialog).toBe(first);
      expect(firstElement).not.toHaveProperty("showModal");
      expect(firstElement).not.toHaveProperty("close");

      for (const close of ["close", "open", "requestClose"] as const) {
        firstElement.addEventListener(
          "cancel",
          (event) => event.preventDefault(),
          {
            once: true,
          }
        );
        first.requestClose("blocked");
        expect(first.open).toBe(true);
        expect(first.returnValue).toBe("");
        expect(() => second.show()).toThrow(
          expect.objectContaining({ name: "InvalidStateError" })
        );
        if (close === "open") first.open = false;
        else first[close]();
        second[otherMode]();
        expect(second.open).toBe(true);
        second.close();
        first[mode]();
      }
      first.close();
      expect(enforcer.activeDialog).toBeUndefined();
    }
  );
});
