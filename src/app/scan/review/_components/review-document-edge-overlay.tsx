"use client";

import { useRef, type PointerEvent } from "react";
import {
  type DocumentCorners,
  type DocumentPoint,
} from "../_lib/process-document-image";

type ReviewDocumentEdgeOverlayProps = {
  corners: DocumentCorners;
  onCornerChange: (cornerIndex: number, point: { x: number; y: number }) => void;
};

export function ReviewDocumentEdgeOverlay({
  corners,
  onCornerChange,
}: ReviewDocumentEdgeOverlayProps) {
  const overlayRef = useRef<SVGSVGElement | null>(null);
  const polygonRef = useRef<SVGPolygonElement | null>(null);
  const handleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const activeCornerIndexRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const draftCornersRef = useRef<DocumentCorners>(corners);
  const points = getPolygonPoints(corners);

  function handlePointerDown(
    event: PointerEvent<SVGCircleElement>,
    cornerIndex: number
  ) {
    draftCornersRef.current = corners;
    activeCornerIndexRef.current = cornerIndex;
    activePointerIdRef.current = event.pointerId;
    overlayRef.current?.setPointerCapture(event.pointerId);
    updateCornerFromPointer(event, cornerIndex, false);
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (activePointerIdRef.current !== event.pointerId) return;

    const cornerIndex = activeCornerIndexRef.current;

    if (cornerIndex === null) return;
    updateCornerFromPointer(event, cornerIndex, false);
  }

  function handlePointerEnd(event: PointerEvent<SVGSVGElement>) {
    if (activePointerIdRef.current !== event.pointerId) return;

    const cornerIndex = activeCornerIndexRef.current;

    if (cornerIndex === null) return;
    updateCornerFromPointer(event, cornerIndex, true);

    if (overlayRef.current?.hasPointerCapture(event.pointerId)) {
      overlayRef.current.releasePointerCapture(event.pointerId);
    }

    activeCornerIndexRef.current = null;
    activePointerIdRef.current = null;
  }

  function updateCornerFromPointer(
    event: PointerEvent<SVGCircleElement | SVGSVGElement>,
    cornerIndex: number,
    commit: boolean
  ) {
    const point = getSvgPointFromPointer(event);

    if (!point) return;

    draftCornersRef.current = draftCornersRef.current.map((corner, index) =>
      index === cornerIndex ? point : corner
    ) as DocumentCorners;
    updateHandlePosition(cornerIndex, point);
    updatePolygonPoints(draftCornersRef.current);

    if (commit) onCornerChange(cornerIndex, point);
  }

  function getSvgPointFromPointer(
    event: PointerEvent<SVGCircleElement | SVGSVGElement>
  ) {
    const svg = overlayRef.current;

    if (!svg) return null;

    const transform = svg.getScreenCTM()?.inverse();

    if (!transform) return null;

    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      transform
    );

    return clampPoint({
      x: point.x,
      y: point.y,
    });
  }

  function updateHandlePosition(cornerIndex: number, point: DocumentPoint) {
    const handle = handleRefs.current[cornerIndex];

    if (!handle) return;

    handle.setAttribute("cx", String(point.x));
    handle.setAttribute("cy", String(point.y));
  }

  function setHandleRef(
    cornerIndex: number,
    handle: SVGCircleElement | null
  ) {
    handleRefs.current[cornerIndex] = handle;
  }

  function updatePolygonPoints(corners: DocumentCorners) {
    polygonRef.current?.setAttribute("points", getPolygonPoints(corners));
  }

  function getPolygonPoints(corners: DocumentCorners) {
    return corners.map((corner) => `${corner.x},${corner.y}`).join(" ");
  }

  function clampPoint(point: DocumentPoint): DocumentPoint {
    return {
      x: Math.min(1, Math.max(0, point.x)),
      y: Math.min(1, Math.max(0, point.y)),
    };
  }

  return (
    <svg
      ref={overlayRef}
      width="100%"
      height="100%"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full touch-none overflow-visible"
      aria-label="Document edge adjustment"
      role="group"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <polygon
        ref={polygonRef}
        points={points}
        className="pointer-events-none fill-sky-400/10 stroke-sky-300"
        vectorEffect="non-scaling-stroke"
        strokeWidth="2"
      />

      {corners.map((corner, index) => (
        <g key={`${corner.x}-${corner.y}-${index}`}>
          <circle
            className="cursor-grab fill-transparent active:cursor-grabbing"
            cx={corner.x}
            cy={corner.y}
            r="0.045"
            vectorEffect="non-scaling-stroke"
            onPointerDown={(event) => handlePointerDown(event, index)}
          />
          <circle
            ref={(handle) => setHandleRef(index, handle)}
            className="pointer-events-none fill-sky-300 stroke-background"
            cx={corner.x}
            cy={corner.y}
            r="0.018"
            vectorEffect="non-scaling-stroke"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
}
