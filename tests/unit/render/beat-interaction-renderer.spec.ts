import { BarElement } from "../../../src/notation/controller/element/bar/bar-element";
import { BeatInteractionRenderer } from "../../../src/notation/render/svg/beat-interaction-renderer";
import { TabBeatElement } from "../../../src/notation/controller/element/beat/tab-beat-element";
import { PlaybackState } from "../../../src/player";
import { Rect } from "../../../src/shared";

class FakeSVGRect {
  public attributes = new Map<string, string>();
  public listener?: (event: Event) => void;

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public get dataset(): DOMStringMap {
    return { barEndGapUuid: "17" } as unknown as DOMStringMap;
  }

  public closest(): FakeSVGRect {
    return this;
  }

  public dispatchEvent(event: Event): boolean {
    this.listener?.(event);
    return true;
  }
}

class FakeSVGGroup {
  public children: FakeSVGRect[] = [];
  public attributes = new Map<string, string>();
  private _listener?: (event: Event) => void;

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public appendChild(child: FakeSVGRect): void {
    this.children.push(child);
  }

  public removeChild(child: FakeSVGRect): void {
    this.children = this.children.filter((candidate) => candidate !== child);
  }

  public querySelector(): FakeSVGRect | null {
    return this.children[0] ?? null;
  }

  public addEventListener(_type: string, listener: EventListener): void {
    this._listener = listener;
    for (const child of this.children) {
      child.listener = listener;
    }
  }

  public removeEventListener(): void {
    this._listener = undefined;
  }

  public get childElementCount(): number {
    return this.children.length;
  }
}

beforeEach(() => {
  (globalThis as any).Element = FakeSVGRect;
  (globalThis as any).SVGRectElement = FakeSVGRect;
  (globalThis as any).document = {
    createElementNS: () => new FakeSVGRect(),
  };
});

function createBarElement(actualTicks: number, scale = 1): BarElement {
  const bar = Object.create(BarElement.prototype) as BarElement;
  (bar as any).bar = {
    uuid: 17,
    getVoiceBar: () => ({ actualTicks, barTicks: 16, beats: [{ uuid: 18 }] }),
  };
  Object.defineProperty(bar, "globalBoundingBox", {
    value: new Rect(100 * scale, 20 * scale, 200 * scale, 80 * scale),
  });
  Object.defineProperty(bar, "endGap", {
    value: new Rect(160 * scale, 0, 24 * scale, 80 * scale),
  });
  Object.defineProperty(bar, "staffLinesGlobal", {
    value: [{ y: 30 * scale }, { y: 70 * scale }],
  });
  return bar;
}

describe("BeatInteractionRenderer end gaps", () => {
  test.each([0.5, 1, 2])(
    "scales the three-gap target and centered hint: %s",
    (scale) => {
      const group = new FakeSVGGroup() as unknown as SVGGElement;
      const renderer = new BeatInteractionRenderer(group, {
        activeVoiceNumber: 1,
        playerUUID: 17,
        isPlaybackActive: false,
      } as any);
      const barElement = createBarElement(4, scale);

      renderer.render([barElement]);

      const target = group.querySelector("[data-bar-end-gap-uuid]");
      expect(target).not.toBeNull();
      expect(target?.getAttribute("x")).toBe(`${228 * scale}`);
      expect(target?.getAttribute("y")).toBe(`${20 * scale}`);
      expect(target?.getAttribute("width")).toBe(`${72 * scale}`);
      expect(target?.getAttribute("height")).toBe(`${80 * scale}`);
      const hint = (group as unknown as FakeSVGGroup).children[1];
      expect(hint.getAttribute("class")).toBe("tu-end-gap-hint");
      expect(hint.getAttribute("pointer-events")).toBe("none");
      expect(hint.getAttribute("x")).toBe(`${264 * scale}`);
      expect(hint.getAttribute("y")).toBe(`${50 * scale}`);

      renderer.render([createBarElement(4, scale * 2)]);
      expect(group.querySelector("[data-bar-end-gap-uuid]")).toBe(target);
      expect(group.childElementCount).toBe(2);
      expect(target?.getAttribute("x")).toBe(`${456 * scale}`);
      expect(target?.getAttribute("width")).toBe(`${144 * scale}`);
      expect(hint.getAttribute("x")).toBe(`${528 * scale}`);
      expect(hint.getAttribute("y")).toBe(`${100 * scale}`);

      renderer.render([createBarElement(16)]);
      expect(group.querySelector("[data-bar-end-gap-uuid]")).toBeNull();
      expect(group.childElementCount).toBe(0);
      renderer.unrender();
    }
  );

  test("delegates only end-gap clicks to the current last beat", () => {
    const group = new FakeSVGGroup() as unknown as SVGGElement;
    const renderer = new BeatInteractionRenderer(group, {
      activeVoiceNumber: 1,
      getBeatElementByUUID: () =>
        Object.create(TabBeatElement.prototype) as TabBeatElement,
    } as any);
    const barElement = createBarElement(4);
    const handler = jest.fn();

    renderer.render([barElement]);
    renderer.attachEvent("click", handler);
    const target = group.querySelector("[data-bar-end-gap-uuid]");
    target?.dispatchEvent({ target, type: "click" } as unknown as Event);

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ target }),
      expect.any(TabBeatElement)
    );
    handler.mockClear();
    renderer.attachEvent("mousedown", handler);
    target?.dispatchEvent({ target, type: "mousedown" } as unknown as Event);
    expect(handler).not.toHaveBeenCalled();
    renderer.unrender();
    expect(group.childElementCount).toBe(0);
  });

  test("hides end-gap hints during playback and restores them after stopping", () => {
    let playbackState = PlaybackState.Idle;
    const group = new FakeSVGGroup() as unknown as SVGGElement;
    const renderer = new BeatInteractionRenderer(group, {
      activeVoiceNumber: 1,
      playerUUID: 17,
      get playbackState() {
        return playbackState;
      },
      get isPlaybackActive() {
        return playbackState !== PlaybackState.Idle;
      },
    } as any);

    renderer.render([createBarElement(4)]);
    expect(group.getAttribute("data-playback-active")).toBe("false");

    playbackState = PlaybackState.Starting;
    renderer.render([createBarElement(4)]);
    expect(group.getAttribute("data-playback-active")).toBe("true");

    playbackState = PlaybackState.Playing;
    renderer.render([createBarElement(4)]);
    expect(group.getAttribute("data-playback-active")).toBe("true");

    playbackState = PlaybackState.Idle;
    renderer.render([createBarElement(4)]);
    expect(group.getAttribute("data-playback-active")).toBe("false");
    renderer.unrender();
  });
});
