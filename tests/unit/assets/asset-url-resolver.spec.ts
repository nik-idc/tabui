import { resolveAssetUrl } from "../../../src/assets";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("asset-url-resolver", () => {
  it("normalizes trailing slashes in base url", () => {
    for (const baseUrl of ["/tabui/", "/tabui", " /tabui/ "]) {
      expect(resolveAssetUrl(baseUrl, "img/ui/play.svg")).toBe(
        "/tabui/img/ui/play.svg"
      );
    }
  });

  it("joins base url and asset path consistently", () => {
    expect(resolveAssetUrl("/tabui/", "img/ui/play.svg")).toBe(
      "/tabui/img/ui/play.svg"
    );
    expect(resolveAssetUrl("/tabui", "/img/ui/play.svg")).toBe(
      "/tabui/img/ui/play.svg"
    );
    expect(resolveAssetUrl("/", "img/ui/play.svg")).toBe("/img/ui/play.svg");
    expect(
      resolveAssetUrl({ baseUrl: "/", variant: "dark" }, "/img/ui/play.svg")
    ).toBe("/img-dark/ui/play.svg");
  });

  it.each(["light", "dark"] as const)(
    "bundles the real %s icon with an empty base url",
    (variant) => {
      const url = resolveAssetUrl({ baseUrl: "", variant }, "/img/ui/play.svg");
      expect(url).toMatch(/^data:image\/svg\+xml,/);
      const folder = variant === "dark" ? "img-dark" : "img";
      const source = readFileSync(
        path.resolve(__dirname, `../../../assets/${folder}/ui/play.svg`),
        "utf8"
      );
      expect(decodeURIComponent(url.slice(url.indexOf(",") + 1))).toBe(source);
    }
  );

  it("uses bundled light icons for the empty string shorthand", () => {
    const url = resolveAssetUrl("", "img/ui/play.svg");
    expect(url).toMatch(/^data:image\/svg\+xml,/);
    const source = readFileSync(
      path.resolve(__dirname, "../../../assets/img/ui/play.svg"),
      "utf8"
    );
    expect(decodeURIComponent(url.slice(url.indexOf(",") + 1))).toBe(source);
  });

  it("requires a bundled icon unless a custom base url is supplied", () => {
    expect(() => resolveAssetUrl("", "img/custom.svg")).toThrow(
      "Unknown bundled icon: img/custom.svg"
    );
    expect(
      resolveAssetUrl("https://example.com/icons/", "img/custom.svg")
    ).toBe("https://example.com/icons/img/custom.svg");
  });

  it("switches to the dark asset tree for dark variants", () => {
    expect(
      resolveAssetUrl({ baseUrl: "/tabui", variant: "dark" }, "img/ui/play.svg")
    ).toBe("/tabui/img-dark/ui/play.svg");
  });
});
