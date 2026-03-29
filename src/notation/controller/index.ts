export * from "./editor";
export * from "./element";
export * from "./selection";
export * from "./track-controller";
export * from "./tab-layout-dimensions";

// TODO(P0-ARCH): Revisit top-level controller module boundaries once Phase 0
// correctness work is done. In particular, check whether `editor/`,
// `selection/`, and the TrackController façade still express the clearest
// ownership model.
