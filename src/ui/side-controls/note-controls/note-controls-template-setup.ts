import { createDiv, createImage } from "@/shared";
import { NoteControlsTemplate } from "./note-controls-template";

const assetsPath = import.meta.env.BASE_URL;

function setupNoteControlsContainer(template: NoteControlsTemplate): void {
  const cssClass = "tu-note-controls";
  template.noteControlsContainer.classList.add(cssClass);
}

function setupDurationButtons(template: NoteControlsTemplate): void {
  const notes = [
    { num: 1, alt: "Whole" },
    { num: 2, alt: "Half" },
    { num: 4, alt: "Quarter" },
    { num: 8, alt: "Eighth" },
    { num: 16, alt: "Sixteenth" },
    { num: 32, alt: "Thirty-second" },
  ];
  for (let i = 0; i < notes.length; i++) {
    const src = `${assetsPath}/img/notes/${notes[i].num}.svg`;
    const dataDuration = `${notes[i].num}`;
    const alt = `${notes[i].alt} note`;

    template.noteDurationButtons[i].setAttribute("src", src);
    template.noteDurationButtons[i].setAttribute("data-duration", dataDuration);
    template.noteDurationButtons[i].setAttribute("alt", alt);
  }

  template.noteControlsContainer.append(...template.noteDurationButtons);
}

function setupDotButtons(template: NoteControlsTemplate): void {
  template.dot1Button.setAttribute("src", `${assetsPath}/img/ui/dot1.svg`);
  template.dot1Button.setAttribute("data-dot", "1");
  template.dot1Button.setAttribute("alt", "Dot");

  template.dot2Button.setAttribute("src", `${assetsPath}/img/ui/dot2.svg`);
  template.dot2Button.setAttribute("data-dot", "2");
  template.dot2Button.setAttribute("alt", "Double dot");

  template.noteControlsContainer.append(
    template.dot1Button,
    template.dot2Button
  );
}

function setupTupletButtons(template: NoteControlsTemplate): void {
  template.tuplet2Button.setAttribute(
    "src",
    `${assetsPath}/img/ui/tuplet-2.svg`
  );
  template.tuplet2Button.setAttribute("data-tuplet", "2");
  template.tuplet2Button.setAttribute("alt", "Tuplet");

  template.tuplet3Button.setAttribute(
    "src",
    `${assetsPath}/img/ui/tuplet-3.svg`
  );
  template.tuplet3Button.setAttribute("data-tuplet", "3");
  template.tuplet3Button.setAttribute("alt", "Triplet");

  template.tupletButton.setAttribute("src", `${assetsPath}/img/ui/tuplet.svg`);
  template.tupletButton.setAttribute("data-tuplet", "0");
  template.tupletButton.setAttribute("alt", "Custom tuplet");

  template.noteControlsContainer.append(
    template.tuplet2Button,
    template.tuplet3Button,
    template.tupletButton
  );
}

/**
 * Responsible for setting up the note controls:
 * Duration change, Dots & Tuplets
 */
export function setupNoteControls(
  rootDiv: HTMLDivElement,
  template: NoteControlsTemplate
): void {
  setupNoteControlsContainer(template);
  setupDurationButtons(template);
  setupDotButtons(template);
  setupTupletButtons(template);

  rootDiv.appendChild(template.noteControlsContainer);
}
