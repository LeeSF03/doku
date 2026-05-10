"use client"

import { type PointerEvent, useLayoutEffect, useRef } from "react"

import { cn } from "@/lib/utils"

import {
  type DocumentCorners,
  type DocumentPoint,
} from "../_lib/process-document-image"

export function ReviewDocumentEdgeOverlay({
  corners,
  onCornerChange,
}: {
  corners: DocumentCorners
  onCornerChange: (cornerIndex: number, point: { x: number; y: number }) => void
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const polygonRef = useRef<SVGPolygonElement | null>(null)
  const handleRefs = useRef<Array<HTMLDivElement | null>>([])
  const activeCornerIndexRef = useRef<number | null>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const draftCornersRef = useRef<DocumentCorners>(corners)
  const points = getPolygonPoints(corners)

  function updateHandlePosition(cornerIndex: number, point: DocumentPoint) {
    const overlay = overlayRef.current
    const handle = handleRefs.current[cornerIndex]

    if (!overlay || !handle) return

    const rect = overlay.getBoundingClientRect()

    handle.style.transform = `translate(${point.x * rect.width}px, ${point.y * rect.height}px) translate(-50%, -50%)`
  }

  useLayoutEffect(() => {
    corners.forEach((corner, index) => updateHandlePosition(index, corner))
  }, [corners])

  function handlePointerDown(
    event: PointerEvent<HTMLDivElement>,
    cornerIndex: number
  ) {
    draftCornersRef.current = [...corners] as DocumentCorners
    activeCornerIndexRef.current = cornerIndex
    activePointerIdRef.current = event.pointerId
    overlayRef.current?.setPointerCapture(event.pointerId)
    updateCornerFromPointer(event, cornerIndex, false)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) return

    if (activeCornerIndexRef.current === null) return
    updateCornerFromPointer(event, activeCornerIndexRef.current, false)
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) return

    if (activeCornerIndexRef.current === null) return
    updateCornerFromPointer(event, activeCornerIndexRef.current, true)

    if (overlayRef.current?.hasPointerCapture(event.pointerId)) {
      overlayRef.current.releasePointerCapture(event.pointerId)
    }

    activeCornerIndexRef.current = null
    activePointerIdRef.current = null
  }

  function updateCornerFromPointer(
    event: PointerEvent<HTMLDivElement>,
    cornerIndex: number,
    commit: boolean
  ) {
    const point = getOverlayPointFromPointer(event)

    if (!point) return

    draftCornersRef.current[cornerIndex] = point
    updateHandlePosition(cornerIndex, point)
    updatePolygonPoints(draftCornersRef.current)

    if (commit) onCornerChange(cornerIndex, point)
  }

  function getOverlayPointFromPointer(event: PointerEvent<HTMLDivElement>) {
    const overlay = overlayRef.current

    if (!overlay) return null

    const rect = overlay.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    }
  }

  function setHandleRef(cornerIndex: number, handle: HTMLDivElement | null) {
    handleRefs.current[cornerIndex] = handle
  }

  function updatePolygonPoints(corners: DocumentCorners) {
    polygonRef.current?.setAttribute("points", getPolygonPoints(corners))
  }

  function getPolygonPoints(corners: DocumentCorners) {
    return corners.map((corner) => `${corner.x},${corner.y}`).join(" ")
  }

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 size-full touch-none overflow-visible"
      aria-label="Document edge adjustment"
      role="group"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <polygon
          ref={polygonRef}
          points={points}
          className="fill-sky-400/10 stroke-sky-300"
          vectorEffect="non-scaling-stroke"
          strokeWidth="2"
        />
      </svg>

      {corners.map((corner, index) => (
        <div
          key={`${corner.x}-${corner.y}-${index}`}
          ref={(handle) => setHandleRef(index, handle)}
          className={cn(
            "border-background absolute top-0 left-0 size-4 cursor-grab rounded-full border-2 bg-sky-300 shadow-sm active:cursor-grabbing"
          )}
          onPointerDown={(event) => {
            handlePointerDown(event, index)
          }}
        />
      ))}
    </div>
  )
}
