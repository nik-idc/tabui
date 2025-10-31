function updateBendPath(x: number, y: number): void {
  if (this._bendPath === undefined) return;
  const width = 420;
  const height = 300;
  const xOffset = 20;
  const d = `M ${xOffset} ${height} Q ${x} ${height}, ${x} ${y} L ${width} ${y}`;
  this._bendPath.setAttribute("d", d);
}

function onBendSelectorMouseMove(
  svg: SVGSVGElement,
  isDragging: boolean,
  bendCircle: SVGCircleElement,
  bendPath: SVGPathElement,
  event: MouseEvent
): void {
  if (
    isDragging === false ||
    bendCircle === undefined ||
    bendPath === undefined
  )
    return;

  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

  const width = 420;
  const height = 300;
  const xOffset = 20;
  const xStep = (width - xOffset) / 12;
  const yStep = height / 12;

  let snappedX = xOffset + Math.round((svgP.x - xOffset) / xStep) * xStep;
  let snappedY = Math.round(svgP.y / yStep) * yStep;

  snappedX = Math.max(xOffset, Math.min(width, snappedX));
  snappedY = Math.max(0, Math.min(height, snappedY));

  bendCircle.setAttribute("cx", snappedX.toString());
  bendCircle.setAttribute("cy", snappedY.toString());

  updateBendPath(snappedX, snappedY);
}

function onPrebendSelectorMouseMove(
  svg: SVGSVGElement,
  isDragging: boolean,
  bendCircle: SVGCircleElement,
  bendPath: SVGPathElement,
  event: MouseEvent
): void {
  if (
    isDragging === false ||
    bendCircle === undefined ||
    bendPath === undefined
  )
    return;

  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

  const height = 300;
  const yStep = height / 12;

  let snappedY = Math.round(svgP.y / yStep) * yStep;
  snappedY = Math.max(0, Math.min(height, snappedY));

  bendCircle.setAttribute("cy", snappedY.toString());

  const d = `M 20 ${snappedY} L 420 ${snappedY}`;
  bendPath.setAttribute("d", d);
}

function onBendReleaseMouseMove(
  svg: SVGSVGElement,
  isDragging: boolean,
  draggedCircle: "peak" | "release" | null,
  peakCircle: SVGCircleElement,
  releaseCircle: SVGCircleElement,
  bendPath: SVGPathElement,
  event: MouseEvent,
  updateBendReleasePath: (x: number, y: number) => void
): void {
  if (isDragging === false) return;

  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

  const width = 420;
  const height = 300;
  const xOffset = 20;
  const xStep = (width - xOffset) / 12;
  const yStep = height / 12;

  let snappedX = xOffset + Math.round((svgP.x - xOffset) / xStep) * xStep;
  let snappedY = Math.round(svgP.y / yStep) * yStep;

  snappedX = Math.max(xOffset, Math.min(width, snappedX));
  snappedY = Math.max(0, Math.min(height, snappedY));

  let peakX = Number(peakCircle?.getAttribute("cx"));
  let peakY = Number(peakCircle?.getAttribute("cy"));
  let releaseX = Number(releaseCircle?.getAttribute("cx"));
  let releaseY = Number(releaseCircle?.getAttribute("cy"));

  if (draggedCircle === "peak" && peakCircle && releaseCircle) {
    peakX = snappedX;
    peakY = snappedY;
    peakCircle.setAttribute("cx", peakX.toString());
    peakCircle.setAttribute("cy", peakY.toString());

    if (releaseY <= peakY) {
      releaseY = peakY + yStep;
      releaseCircle.setAttribute("cy", releaseY.toString());
    }
    if (releaseX < peakX + xStep) {
      releaseX = peakX + xStep;
      releaseCircle.setAttribute("cx", releaseX.toString());
    }
  } else if (draggedCircle === "release" && releaseCircle && peakCircle) {
    releaseX = snappedX;
    releaseY = snappedY;
    if (releaseY <= peakY) {
      releaseY = peakY + yStep;
    }
    if (releaseX < peakX + xStep) {
      releaseX = peakX + xStep;
    }
    releaseCircle.setAttribute("cx", releaseX.toString());
    releaseCircle.setAttribute("cy", releaseY.toString());
  }

  updatePath(peakX, peakY, releaseX, releaseY);
}
