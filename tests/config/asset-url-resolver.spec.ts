import {
  normalizeAssetBaseUrl,
  resolveAssetUrl,
} from "../../src/config/asset-url-resolver";

describe("asset-url-resolver", () => {
  it("normalizes trailing slashes in base url", () => {
    expect(normalizeAssetBaseUrl("/tabui/")).toBe("/tabui");
    expect(normalizeAssetBaseUrl("/tabui")).toBe("/tabui");
    expect(normalizeAssetBaseUrl("")).toBe("");
  });

  it("joins base url and asset path consistently", () => {
    expect(resolveAssetUrl("/tabui/", "img/ui/play.svg")).toBe(
      "/tabui/img/ui/play.svg"
    );
    expect(resolveAssetUrl("/tabui", "/img/ui/play.svg")).toBe(
      "/tabui/img/ui/play.svg"
    );
  });

  it("returns a relative asset path when base url is empty", () => {
    expect(resolveAssetUrl("", "img/ui/play.svg")).toBe("img/ui/play.svg");
  });

  it("switches to the dark asset tree for dark variants", () => {
    expect(
      resolveAssetUrl({ baseUrl: "/tabui", variant: "dark" }, "img/ui/play.svg")
    ).toBe("/tabui/img-dark/ui/play.svg");
  });
});
