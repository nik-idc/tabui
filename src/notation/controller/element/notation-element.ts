import { Point, Rect } from "../../../shared";
import { TrackElement } from "./track-element";
import { VoiceNumber } from "../../model";
import type { BarElement } from "./bar/bar-element";
import type { TrackLineElement } from "./track/track-line-element";

/** Identifies the role of a node in the notation hierarchy. */
export enum NotationNodeType {
  /** A layout and ownership node without self-contained notation geometry. */
  Container = "container",
  /** A node with self-contained notation geometry. */
  Element = "element",
}

/**
 * Common contract for nodes that participate in notation hierarchy and layout.
 * Nodes use line-local geometry so materialized track lines can move cheaply.
 */
export interface NotationNode {
  /** Runtime role used to narrow the node to an element or container. */
  readonly nodeType: NotationNodeType;
  /** Constant identifier for this node instance. */
  readonly uuid: number;
  /** Root track element that owns this node. */
  readonly trackElement: TrackElement;
  /** Voice represented by this node, or null for shared notation. */
  readonly voiceNumber: VoiceNumber | null;
  /** Materialized track line that owns this node. */
  readonly owningTrackLineElement: TrackLineElement;
  /** Bar element that owns this node, or null for line-owned notation. */
  readonly owningBarElement: BarElement | null;

  /** Builds or reconciles this node's immediate descendants and state. */
  build(): void;
  /** Calculates dimensions for this node and its descendants. */
  measure(): void;
  /** Positions this node and its descendants in the owning track line. */
  layout(): void;
  /** Rebuilds, measures, and lays out this node. */
  update(): void;

  /** Presentation state; element hashes participate in diffing. */
  get stateHash(): string;

  /** Bounds relative to this node's immediate layout context. */
  get boundingBox(): Rect;
  /** Origin relative to the owning track line. */
  readonly lineLocalCoords: Point;
  /** Bounds relative to the owning track line. */
  readonly lineLocalBoundingBox: Rect;
  /** Origin relative to the notation root. */
  get globalCoords(): Point;
  /** Bounds relative to the notation root. */
  get globalBoundingBox(): Rect;

  /** Transitional alias for boundingBox. */
  get rect(): Rect;
  /** Transitional alias for globalBoundingBox. */
  get globalRect(): Rect;

  /** Returns identity that remains stable across node reconstruction. */
  getStableIdentity(): string;
  /** Returns this node and its descendant nodes in hierarchy order. */
  refreshOwnedNotationNodes(): NotationNode[];
}

/** A notation node with self-contained geometry. */
export interface NotationElement extends NotationNode {
  readonly nodeType: NotationNodeType.Element;
}

/** A notation node that only owns hierarchy and aggregate layout. */
export interface NotationContainer extends NotationNode {
  readonly nodeType: NotationNodeType.Container;
}

/** Returns whether a notation node has self-contained notation geometry. */
export function isNotationElement(node: NotationNode): node is NotationElement {
  return node.nodeType === NotationNodeType.Element;
}

/** Returns whether a notation node only owns hierarchy and aggregate layout. */
export function isNotationContainer(
  node: NotationNode
): node is NotationContainer {
  return node.nodeType === NotationNodeType.Container;
}

/** Constructor type for concrete notation elements. */
export type NotationElementClass = new (...args: never[]) => NotationElement;
