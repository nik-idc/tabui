import { NotationComponent } from "../../src/notation/notation-component";
import { TrackController } from "../../src/notation/controller";
import { EditorSVGRenderer } from "../../src/notation/render";
import { ScorePlayer } from "../../src/player";
import { createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";

const mockTrackControllers: Array<{
  track: unknown;
  player: unknown;
  trackElement: {
    update: jest.Mock;
    getTrackLineElementForBeat: jest.Mock;
    refreshLayout: jest.Mock;
  };
}> = [];

const mockRenderers: Array<{
  trackController: unknown;
  render: jest.Mock;
  dispose: jest.Mock;
  attachViewportScrollEvent: jest.Mock;
  detachViewportScrollEvent: jest.Mock;
  prepareViewportForTrackLine: jest.Mock;
}> = [];

const mockPlayers: Array<{
  dispose: jest.Mock;
  setActiveTrack: jest.Mock;
  getCurrentBeatForTrack: jest.Mock;
}> = [];
let mockPlaybackLineForTrack: unknown;

jest.mock("../../src/notation/controller", () => ({
  TrackController: jest
    .fn()
    .mockImplementation(
      (track: unknown, layoutDimensions: unknown, player: unknown) => {
        const instance = {
          track,
          layoutDimensions,
          player,
          trackElement: {
            update: jest.fn(),
            getTrackLineElementForBeat: jest.fn(() => mockPlaybackLineForTrack),
            refreshLayout: jest.fn(),
          },
        };
        mockTrackControllers.push(instance);
        return instance;
      }
    ),
}));

jest.mock("../../src/notation/render", () => ({
  EditorSVGRenderer: jest
    .fn()
    .mockImplementation(
      (rootDiv: unknown, trackController: unknown, assets: unknown) => {
        const instance = {
          rootDiv,
          trackController,
          assets,
          render: jest.fn(() => []),
          dispose: jest.fn(),
          attachViewportScrollEvent: jest.fn(),
          detachViewportScrollEvent: jest.fn(),
          prepareViewportForTrackLine: jest.fn(),
        };
        mockRenderers.push(instance);
        return instance;
      }
    ),
}));

jest.mock("../../src/player", () => ({
  ScorePlayer: jest.fn().mockImplementation(() => {
    const instance = {
      dispose: jest.fn(),
      setActiveTrack: jest.fn(),
      getCurrentBeatForTrack: jest.fn(),
    };
    mockPlayers.push(instance);
    return instance;
  }),
}));

describe("NotationComponent", () => {
  beforeEach(() => {
    mockTrackControllers.length = 0;
    mockRenderers.length = 0;
    mockPlayers.length = 0;
    mockPlaybackLineForTrack = undefined;
    jest.clearAllMocks();
  });

  test("reuses one player across repeated track loads and disposes it once", () => {
    const { score, track } = createScoreGraph();
    const nextTrack = score.addTrack(track.context.instrument, "Track 2")
      .tracks[0];
    const rootDiv = { appendChild: jest.fn() } as unknown as HTMLDivElement;
    const notation = new NotationComponent(
      rootDiv,
      score,
      {
        assets: {} as any,
        playback: {} as any,
        layout: {} as any,
        interaction: { mode: "edit" },
      } as any,
      TEST_LAYOUT_DIMENSIONS
    );

    notation.loadTrack(nextTrack);
    notation.loadTrack(track);
    notation.dispose();
    notation.dispose();

    expect(ScorePlayer).toHaveBeenCalledTimes(1);
    expect(TrackController).toHaveBeenCalledTimes(3);
    expect(mockTrackControllers[0].player).toBe(mockTrackControllers[1].player);
    expect(mockTrackControllers[1].player).toBe(mockTrackControllers[2].player);
    expect(mockPlayers[0].setActiveTrack).toHaveBeenNthCalledWith(1, nextTrack);
    expect(mockPlayers[0].setActiveTrack).toHaveBeenNthCalledWith(2, track);
    expect(mockRenderers[1].render.mock.invocationCallOrder[0]).toBeLessThan(
      mockPlayers[0].setActiveTrack.mock.invocationCallOrder[0]
    );
    expect(mockPlayers[0].dispose).toHaveBeenCalledTimes(1);
    for (const controller of mockTrackControllers) {
      expect(controller.trackElement.update).not.toHaveBeenCalled();
    }
    expect(mockRenderers[0].dispose).toHaveBeenCalledTimes(1);
    expect(mockRenderers[1].dispose).toHaveBeenCalledTimes(1);
    expect(mockRenderers[2].dispose).toHaveBeenCalledTimes(1);
  });

  test("prepares the buffered playback line before rendering and retargeting", () => {
    const { score, track } = createScoreGraph();
    const nextTrack = score.addTrack(track.context.instrument, "Track 2")
      .tracks[0];
    const playbackBeat = {};
    mockPlaybackLineForTrack = {};
    const notation = new NotationComponent(
      { appendChild: jest.fn() } as unknown as HTMLDivElement,
      score,
      {
        assets: {} as any,
        playback: {} as any,
        layout: {} as any,
        interaction: { mode: "edit" },
      } as any,
      TEST_LAYOUT_DIMENSIONS
    );
    mockPlayers[0].getCurrentBeatForTrack.mockReturnValue(playbackBeat);

    notation.loadTrack(nextTrack);

    expect(
      mockTrackControllers[1].trackElement.getTrackLineElementForBeat
    ).toHaveBeenCalledWith(playbackBeat);
    expect(mockRenderers[1].prepareViewportForTrackLine).toHaveBeenCalledWith(
      mockPlaybackLineForTrack
    );
    expect(
      mockRenderers[1].prepareViewportForTrackLine.mock.invocationCallOrder[0]
    ).toBeLessThan(mockRenderers[1].render.mock.invocationCallOrder[0]);
    expect(mockRenderers[1].render.mock.invocationCallOrder[0]).toBeLessThan(
      mockPlayers[0].setActiveTrack.mock.invocationCallOrder[0]
    );
  });

  test("refreshes active track geometry for an explicit layout refresh", () => {
    const { score } = createScoreGraph();
    const notation = new NotationComponent(
      { appendChild: jest.fn() } as unknown as HTMLDivElement,
      score,
      {
        assets: {} as any,
        playback: {} as any,
        layout: {} as any,
        interaction: { mode: "edit" },
      } as any,
      TEST_LAYOUT_DIMENSIONS
    );

    notation.refreshLayout();

    expect(
      mockTrackControllers[0].trackElement.refreshLayout
    ).toHaveBeenCalledTimes(1);
  });
});
