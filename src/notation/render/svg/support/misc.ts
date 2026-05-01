export function toDomIdFragment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/**
 * Keeps a stable child node at a deterministic layer index.
 *
 * SVG renderers cache and reuse container groups. Re-inserting only when the
 * node is out of place preserves that cached DOM while still keeping layer
 * order deterministic after viewport/window reconciliation.
 */
export function ensureDomChildAtIndex(
  parent: SVGGElement,
  child: SVGGElement,
  index: number
): void {
  const referenceChild = parent.children.item(index);
  const alreadyLastAtIndex =
    referenceChild === null &&
    child.parentNode === parent &&
    parent.lastElementChild === child;
  if (referenceChild === child || alreadyLastAtIndex) {
    return;
  }

  parent.insertBefore(child, referenceChild);
}
