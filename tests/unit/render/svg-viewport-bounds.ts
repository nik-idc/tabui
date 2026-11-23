/** Supplies scrolling SVG bounds that jsdom cannot calculate without layout. */
export function mockSvgViewportBounds(): void {
  const getBoundingClientRect = SVGElement.prototype.getBoundingClientRect;
  jest
    .spyOn(SVGElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: SVGElement) {
      const rect = getBoundingClientRect.call(this);
      const viewport = this.parentElement;
      if (this.localName !== "svg" || viewport === null) {
        return rect;
      }
      const top = viewport.getBoundingClientRect().top - viewport.scrollTop;
      return { ...rect, y: top, top, bottom: top + rect.height };
    });
}
