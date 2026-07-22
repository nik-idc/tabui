import { TrackController } from "../../controller";
import { BeatElement } from "../../controller/element/beat/beat-element";
import { TabBeatElement } from "../../controller/element/beat/tab-beat-element";
import { TrackLineElement } from "../../controller/element/track/track-line-element";
import { createSVGRect } from "../../../shared";
import {
  trackEvent,
  TrackEventArgs,
  TrackEventType,
} from "../../../shared/events";

type CursorAnimation = {
  startX: number;
  endX: number;
  startTime: number;
  endTime: number;
  playbackRunId: number;
};

type ResolvedCursorBeat = {
  beatElement: BeatElement;
  trackLineElement: TrackLineElement;
};

const PLAYER_CURSOR_WIDTH_PX = 5;
const PLAYER_CURSOR_ADD_HEIGHT_PX = 10;

export class PlayerOverlayRenderer {
  private _playerGroup: SVGGElement;
  private readonly _playerCursorRect: SVGRectElement;
  private _animationFrame?: number;
  private _activeAnimation?: CursorAnimation;
  private _boundUpdateAnimation: FrameRequestCallback;
  private _beatChangedBound: boolean;
  private _activeBeatChange?: TrackEventArgs[TrackEventType.PlayerCurBeatChanged];
  private _boundOnBeatChanged: (
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ) => void;

  constructor(
    playerGroup: SVGGElement,
    private readonly trackController: TrackController,
    private readonly ensureTrackLineVisible: (
      trackLine: TrackLineElement
    ) => void
  ) {
    this._playerGroup = playerGroup;
    this._playerCursorRect = createSVGRect();
    this._playerCursorRect.setAttribute("id", "playerCursor");
    this._beatChangedBound = false;
    this._boundOnBeatChanged = this.onBeatChanged.bind(this);
    this._boundUpdateAnimation = () => this.updateAnimation();
  }

  private bindToBeatChanged(): void {
    if (this._beatChangedBound) {
      return;
    }

    trackEvent.on(
      TrackEventType.PlayerCurBeatChanged,
      this._boundOnBeatChanged
    );
    this._beatChangedBound = true;
  }

  private unbindFromBeatChanged(): void {
    if (!this._beatChangedBound) {
      return;
    }

    trackEvent.off(
      TrackEventType.PlayerCurBeatChanged,
      this._boundOnBeatChanged
    );
    this._beatChangedBound = false;
  }

  private cancelAnimation(): void {
    if (this._animationFrame !== undefined) {
      cancelAnimationFrame(this._animationFrame);
    }

    this._animationFrame = undefined;
    this._activeAnimation = undefined;
  }

  private hideCursor(): void {
    this._playerCursorRect.setAttribute("width", "0");
    this._playerCursorRect.setAttribute("height", "0");
  }

  private positionCursorAtBeat(beatElement: BeatElement): void {
    if (!(beatElement instanceof TabBeatElement)) {
      return;
    }

    const x = beatElement.attackXGlobal;
    let y = beatElement.globalCoords.y - PLAYER_CURSOR_ADD_HEIGHT_PX;
    let height = beatElement.boundingBox.height + PLAYER_CURSOR_ADD_HEIGHT_PX;

    const outlineLines = beatElement.owningTrackLineElement.outlineLinesGlobal;
    if (outlineLines !== undefined) {
      y = outlineLines.left.y1;
      height = outlineLines.left.height;
    }

    this._playerCursorRect.setAttribute("y", `${y}`);
    this._playerCursorRect.setAttribute("width", `${PLAYER_CURSOR_WIDTH_PX}`);
    this._playerCursorRect.setAttribute("height", `${height}`);
    this._playerCursorRect.setAttribute(
      "x",
      `${x - PLAYER_CURSOR_WIDTH_PX / 2}`
    );
  }

  private snapToBeat(beatElement: BeatElement): void {
    this.cancelAnimation();
    this.positionCursorAtBeat(beatElement);
  }

  private updateAnimation(): void {
    this._animationFrame = undefined;
    const animation = this._activeAnimation;
    if (
      animation === undefined ||
      animation.playbackRunId !== this.trackController.playerRunId
    ) {
      this._activeAnimation = undefined;
      return;
    }

    const currentTime = this.trackController.playerCurrentTime;
    if (currentTime === undefined) {
      this._activeAnimation = undefined;
      return;
    }

    const progressFraction =
      (currentTime - animation.startTime) /
      (animation.endTime - animation.startTime);
    const progress = Math.max(0, Math.min(1, progressFraction));
    const animationProgress = (animation.endX - animation.startX) * progress;
    const animationX = animation.startX + animationProgress;
    const x = animationX - PLAYER_CURSOR_WIDTH_PX / 2;
    this._playerCursorRect.setAttribute("x", `${x}`);
    if (progress < 1) {
      this._animationFrame = requestAnimationFrame(this._boundUpdateAnimation);
    } else {
      this._activeAnimation = undefined;
    }
  }

  private animateToX(
    startBeatElement: TabBeatElement,
    endX: number,
    startTime: number,
    endTime: number,
    playbackRunId: number
  ): void {
    this.cancelAnimation();
    if (playbackRunId !== this.trackController.playerRunId) {
      return;
    }

    this.positionCursorAtBeat(startBeatElement);
    const startX = startBeatElement.attackXGlobal;
    if (endX <= startX || endTime <= startTime) {
      return;
    }

    this._activeAnimation = {
      startX,
      endX,
      startTime,
      endTime,
      playbackRunId,
    };
    this.updateAnimation();
  }

  private animateThroughBeat(
    beatElement: BeatElement,
    startTime: number,
    endTime: number,
    playbackRunId: number
  ): void {
    if (!(beatElement instanceof TabBeatElement)) {
      this.snapToBeat(beatElement);
      return;
    }

    const startX = beatElement.attackXGlobal;
    this.animateToX(
      beatElement,
      startX + beatElement.boundingBox.width,
      startTime,
      endTime,
      playbackRunId
    );
  }

  private animateBetweenBeats(
    startBeatElement: BeatElement,
    endBeatElement: BeatElement,
    startTime: number,
    endTime: number,
    playbackRunId: number
  ): void {
    if (
      !(startBeatElement instanceof TabBeatElement) ||
      !(endBeatElement instanceof TabBeatElement) ||
      startBeatElement.owningTrackLineElement !==
        endBeatElement.owningTrackLineElement
    ) {
      this.snapToBeat(startBeatElement);
      return;
    }

    const endX = endBeatElement.attackXGlobal;
    this.animateToX(startBeatElement, endX, startTime, endTime, playbackRunId);
  }

  private resolveVisibleBeat(beatUUID: number): ResolvedCursorBeat | undefined {
    const beat = this.trackController.getBeatByUUID(beatUUID);
    if (beat === undefined) {
      return undefined;
    }

    let trackLineElement =
      this.trackController.trackElement.getTrackLineElementForBeat(beat);
    if (trackLineElement === undefined) {
      return undefined;
    }

    this.ensureTrackLineVisible(trackLineElement);
    trackLineElement =
      this.trackController.trackElement.getTrackLineElementForBeat(beat);
    const beatElement = this.trackController.trackElement.getBeatElement(beat);
    if (trackLineElement === undefined || beatElement === undefined) {
      return undefined;
    }

    return { beatElement, trackLineElement };
  }

  private renderBeatChange(
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ): void {
    const resolvedBeat = this.resolveVisibleBeat(args.beatUUID);
    if (resolvedBeat === undefined) {
      return;
    }
    const { beatElement, trackLineElement } = resolvedBeat;

    if (args.nextBeatUUID === undefined) {
      this.animateThroughBeat(
        beatElement,
        args.startTime,
        args.endTime,
        args.playbackRunId
      );
      return;
    }

    const nextBeat = this.trackController.getBeatByUUID(args.nextBeatUUID);
    if (nextBeat === undefined) {
      this.snapToBeat(beatElement);
      return;
    }

    const nextTrackLineElement =
      this.trackController.trackElement.getTrackLineElementForBeat(nextBeat);
    if (nextTrackLineElement !== trackLineElement) {
      this.snapToBeat(beatElement);
      return;
    }

    const nextBeatElement =
      this.trackController.trackElement.getBeatElement(nextBeat);
    if (nextBeatElement === undefined) {
      this.snapToBeat(beatElement);
      return;
    }

    this.animateBetweenBeats(
      beatElement,
      nextBeatElement,
      args.startTime,
      args.endTime,
      args.playbackRunId
    );
  }

  private onBeatChanged(
    args: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]
  ): void {
    if (
      args.trackUUID !== this.trackController.track.uuid ||
      args.playerUUID !== this.trackController.playerUUID ||
      args.playbackRunId !== this.trackController.playerRunId
    ) {
      return;
    }

    this._activeBeatChange = args;
    this.renderBeatChange(args);
  }

  public render(): void {
    if (this.trackController.isPlaying) {
      this.renderPlaying();
    } else {
      this.hide();
    }
  }

  private renderPlaying(): void {
    this._playerGroup.appendChild(this._playerCursorRect);
    this.bindToBeatChanged();
    this._playerCursorRect.setAttribute("stroke", "var(--tu-notation-ink)");
    this._playerCursorRect.setAttribute("fill", "var(--tu-notation-cursor)");
    if (
      this._activeBeatChange !== undefined &&
      this._activeBeatChange.playbackRunId === this.trackController.playerRunId
    ) {
      this.renderBeatChange(this._activeBeatChange);
      return;
    }
    this._activeBeatChange = undefined;
    this.cancelAnimation();

    const lastStartedBeatElement =
      this.trackController.playerLastStartedBeatElement;
    if (lastStartedBeatElement === undefined) {
      this.hideCursor();
      return;
    }

    this.positionCursorAtBeat(lastStartedBeatElement);
  }

  private hide(): void {
    this._playerGroup.appendChild(this._playerCursorRect);

    this.hideCursor();
    this.cancelAnimation();
    this._activeBeatChange = undefined;
  }

  public unrender(): void {
    this.unbindFromBeatChanged();
    this.cancelAnimation();
    this._activeBeatChange = undefined;
    this._playerCursorRect.remove();
  }
}
