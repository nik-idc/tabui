export function toDomIdFragment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/**
 * Keeps a stable child node at a deterministic paint-order index.
 *
 * SVG renderers cache and reuse container groups across viewport changes. SVG
 * paint order follows DOM child order, so retained groups must be reinserted
 * only when they drift from their layer slot.
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
