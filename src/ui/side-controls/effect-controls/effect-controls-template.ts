/**
 * Interface defining the template of effect controls:
 * - Vibrato
 * - P.M.
 * - NH
 * - PH
 * - Hammer-on
 * - Pull-off
 * - Slide
 * - Bend
 */
export interface EffectControlsTemplate {
  readonly effectControlsContainer: HTMLDivElement;

  readonly vibratoButton: HTMLImageElement;
  readonly palmMuteButton: HTMLImageElement;
  readonly nhButton: HTMLImageElement;
  readonly phButton: HTMLImageElement;
  readonly hammerOnButton: HTMLImageElement;
  readonly pullOffButton: HTMLImageElement;
  readonly slideButton: HTMLImageElement;
  readonly bendButton: HTMLImageElement;
}
