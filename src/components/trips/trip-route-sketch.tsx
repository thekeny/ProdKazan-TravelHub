"use client";

import { useMemo } from "react";
import type { RoutePoint } from "@/configs/types/route.type";

const INSET_X = 10;
const INSET_Y = 14;
const MARKER_SIZE = 9;

type ProjectedPoint = { x: number; y: number };

/**
 * Проецирует точки поездки в полосу карточки: последовательность точек
 * сохраняется, а масштаб подстраивается под ширину полосы.
 */
function project(points: readonly RoutePoint[]): ProjectedPoint[] {
  if (!points.length) return [];
  const midLat =
    (points.reduce((sum, point) => sum + point.lat, 0) / points.length) *
    (Math.PI / 180);
  const lngScale = Math.cos(midLat);
  const xs = points.map((point) => point.lng * lngScale);
  const ys = points.map((point) => -point.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1e-4);
  const spanY = Math.max(maxY - minY, 1e-4);
  const width = 100 - INSET_X * 2;
  const height = 100 - INSET_Y * 2;
  return xs.map((_, index) => ({
    x: INSET_X + ((xs[index] - minX) / spanX) * width,
    y: INSET_Y + ((ys[index] - minY) / spanY) * height,
  }));
}

export function TripRouteSketch({
  points,
  className,
}: {
  points: readonly RoutePoint[];
  className?: string;
}) {
  const projected = useMemo(() => project(points), [points]);
  if (projected.length < 2) return null;
  const polyline = projected.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none ${className ?? ""}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <polyline
          points={polyline}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5 7"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {projected.map((point, index) => {
        const last = index === projected.length - 1;
        return (
          <span
            key={`${point.x}-${point.y}-${index}`}
            className={`absolute block -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-current ${
              last ? "bg-current" : "bg-surface"
            }`}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: last ? MARKER_SIZE + 2 : MARKER_SIZE,
              height: last ? MARKER_SIZE + 2 : MARKER_SIZE,
            }}
          />
        );
      })}
    </span>
  );
}
