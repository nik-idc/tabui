import { EditorShellCallbacks } from "../../src/ui/editor-shell/editor-shell-callbacks";
import { FakeElement } from "./helpers";

function createShellComponent() {
  const root = new FakeElement();
  const toggle = new FakeElement();
  let collapsed = false;
  const component = {
    rootDiv: root,
    template: { sidePanelToggle: toggle },
    config: {
      panels: { side: { visible: true, collapsible: true } },
    },
    get sidePanelCollapsed(): boolean {
      return collapsed;
    },
    toggleSidePanel: jest.fn(() => {
      collapsed = !collapsed;
      return collapsed;
    }),
    setSidePanelCollapsed: jest.fn((nextCollapsed: boolean) => {
      collapsed = nextCollapsed;
    }),
  };
  return { component, toggle };
}

describe("EditorShellCallbacks", () => {
  test("refreshes layout immediately after toggling", () => {
    const { component, toggle } = createShellComponent();
    const refreshLayout = jest.fn();
    const callbacks = new EditorShellCallbacks(component as any, refreshLayout);
    callbacks.bind();

    toggle.dispatch("click");

    expect(component.sidePanelCollapsed).toBe(true);
    expect(refreshLayout).toHaveBeenCalledTimes(1);
    callbacks.unbind();
  });

  test("rolls panel state back when layout refresh fails", () => {
    const { component, toggle } = createShellComponent();
    const callbacks = new EditorShellCallbacks(component as any, () => {
      throw new Error("layout failed");
    });
    callbacks.bind();

    expect(() => toggle.dispatch("click")).toThrow("layout failed");

    expect(component.setSidePanelCollapsed).toHaveBeenCalledWith(false);
    expect(component.sidePanelCollapsed).toBe(false);
    callbacks.unbind();
  });

  test("removes the toggle listener when unbound", () => {
    const { component, toggle } = createShellComponent();
    const refreshLayout = jest.fn();
    const callbacks = new EditorShellCallbacks(component as any, refreshLayout);
    callbacks.bind();
    callbacks.unbind();

    toggle.dispatch("click");

    expect(refreshLayout).not.toHaveBeenCalled();
  });
});
