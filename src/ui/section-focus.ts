/**
 * Editor sections that Alt+Up and Alt+Down move focus between, in visual
 * order. Each section gets focus on its first control that can take it.
 * Sections that are hidden, collapsed, or fully disabled are skipped.
 */
const SECTION_SELECTORS: readonly string[] = [
  ".tu-play-controls",
  ".tu-score-controls",
  ".tu-track-list",
  ".tu-side-controls-toggle",
  ".tu-note-controls > .tu-control-section",
  ".tu-technique-controls",
  ".tu-measure-controls",
  ".tu-staff-controls",
  ".tu-score-header",
];

const FOCUSABLE = "button, input, select, textarea, a[href], [tabindex]";

function canFocus(element: HTMLElement): boolean {
  return (
    element.tabIndex >= 0 &&
    !element.matches(":disabled") &&
    element.closest("[inert], [hidden]") === null &&
    element.getClientRects().length > 0
  );
}

function firstFocusable(section: HTMLElement): HTMLElement | undefined {
  if (section.matches(FOCUSABLE) && canFocus(section)) {
    return section;
  }
  return Array.from(section.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
    canFocus
  );
}

/** Returns the sections of an editor in order, ending with the notation. */
function getSections(root: HTMLElement, notation: HTMLElement): HTMLElement[] {
  const sections = SECTION_SELECTORS.flatMap((selector) =>
    Array.from(root.querySelectorAll<HTMLElement>(selector))
  );
  return [...sections, notation];
}

/**
 * Moves focus to the first control of the next (offset 1) or previous
 * (offset -1) section, wrapping around. Returns false if no section can take
 * focus.
 */
export function focusAdjacentSection(
  root: HTMLElement,
  notation: HTMLElement,
  offset: 1 | -1
): boolean {
  const sections = getSections(root, notation).filter(
    (section) => firstFocusable(section) !== undefined
  );
  if (sections.length === 0) {
    return false;
  }

  const active = document.activeElement;
  // The notation contains the score header. The header comes first in the
  // list, so focus in the header finds the header.
  const index = sections.findIndex(
    (section) => active !== null && section.contains(active)
  );
  // From outside every section, Down goes to the first and Up to the last.
  let next = index === -1 ? (offset === 1 ? 0 : -1) : index + offset;
  if (next < 0) {
    next = sections.length - 1;
  } else if (next >= sections.length) {
    next = 0;
  }
  firstFocusable(sections[next])?.focus();
  return true;
}
