"use client";

import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Button } from "@/components/ui/button";
import { MAP } from "@/configs/consts/map.const";
import { OFFLINE } from "@/configs/consts/offline.const";
import {
  TRANSPORT_STYLES,
  TRANSPORT_TYPES,
} from "@/configs/consts/transport.const";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import { useOnline } from "@/lib/connectivity";
import { mapPointColor } from "@/lib/map-point-color";

const travelerIcon = divIcon({
  className: "",
  html: `<div class="flex h-10 w-9 items-center justify-center rounded-xl border border-border bg-surface text-primary-strong shadow-md">
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <path d="m6 9 6 2 6-2M12 11v6m-4 5 4-5 4 5" />
    </svg>
  </div>`,
  iconSize: [36, 40],
  iconAnchor: [18, 36],
});

type Props = {
  points: RoutePoint[];
  legs?: TripLeg[];
  selectedPointId?: string | null;
  selectedLegId?: string | null;
  onSelectPoint?: (id: string) => void;
  onSelectLeg?: (id: string) => void;
  onPlace?: (place: { lat: number; lng: number }) => void;
  draftPlace?: { lat: number; lng: number } | null;
  currentPosition?: { lat: number; lng: number } | null;
  className?: string;
  overlayInset?: number;
};

function MapBehavior({
  points,
  legs,
  selectedPointId,
  selectedLegId,
  onPlace,
}: Props) {
  const map = useMap();
  useMapEvents({
    click(event) {
      onPlace?.({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(((((event.latlng.lng + 180) % 360) + 360) % 360) - 180),
      });
    },
  });
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    if (onPlace) return;
    const byId = new Map(points.map((point) => [point.id, point]));
    const leg = legs?.find((item) => item.id === selectedLegId);
    if (leg) {
      const from = byId.get(leg.fromPointId);
      const to = byId.get(leg.toPointId);
      if (from && to)
        map.fitBounds(
          [
            [from.lat, from.lng],
            [to.lat, to.lng],
          ],
          { padding: [60, 60], maxZoom: MAP.pointZoom },
        );
      return;
    }
    const selected = points.find((point) => point.id === selectedPointId);
    if (selected) {
      map.panTo([selected.lat, selected.lng]);
      return;
    }
    const positions = points.map(
      (point) => [point.lat, point.lng] as [number, number],
    );
    if (positions.length)
      map.fitBounds(positions, { padding: [40, 40], maxZoom: MAP.pointZoom });
    else map.setView(MAP.center, MAP.zoom);
  }, [points, legs, selectedPointId, selectedLegId, map, onPlace]);
  return null;
}

export default function TripMap(props: Props) {
  const online = useOnline();
  const [initialView] = useState(() => ({
    center: props.draftPlace
      ? ([props.draftPlace.lat, props.draftPlace.lng] as [number, number])
      : MAP.center,
    zoom: props.draftPlace ? MAP.pointZoom : MAP.zoom,
  }));
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const byId = useMemo(
    () => new Map(props.points.map((point) => [point.id, point])),
    [props.points],
  );
  const transports = useMemo(
    () => Array.from(new Set((props.legs ?? []).map((leg) => leg.transport))),
    [props.legs],
  );
  return (
    <section
      className={`relative isolate overflow-hidden rounded-xl bg-muted ${
        props.className ?? "h-[360px] sm:h-[500px] xl:h-[640px]"
      }`}
      style={
        props.overlayInset
          ? ({
              "--map-bottom-overlay": `${props.overlayInset}px`,
            } as React.CSSProperties)
          : undefined
      }
      aria-label="Карта маршрута и событий поездки"
    >
      <MapContainer
        center={initialView.center}
        zoom={initialView.zoom}
        attributionControl={false}
        className="h-full w-full"
      >
        {/* prefix={false} убирает брендинг Leaflet, оставляя атрибуцию тайлов. */}
        <AttributionControl prefix={false} />
        <TileLayer
          key={attempt}
          url={MAP.tiles}
          attribution={MAP.attribution}
          referrerPolicy={MAP.referrerPolicy}
          eventHandlers={{ tileerror: () => setFailed(true) }}
        />
        <MapBehavior {...props} />
        {(props.legs ?? []).map((leg) => {
          const from = byId.get(leg.fromPointId);
          const to = byId.get(leg.toPointId);
          if (!from || !to) return null;
          const style = TRANSPORT_STYLES[leg.transport];
          return (
            <Polyline
              key={leg.id}
              positions={[
                [from.lat, from.lng],
                [to.lat, to.lng],
              ]}
              pathOptions={{
                color: style.color,
                dashArray: style.dashArray,
                weight:
                  leg.id === props.selectedLegId
                    ? style.weight + 2
                    : style.weight,
                opacity: leg.id === props.selectedLegId ? 1 : 0.7,
              }}
              eventHandlers={{
                click: () => props.onSelectLeg?.(leg.id),
              }}
            />
          );
        })}
        {props.points.map((point) => (
          <CircleMarker
            key={`${point.id}-hit`}
            center={[point.lat, point.lng]}
            radius={20}
            pathOptions={{ opacity: 0, fillOpacity: 0, weight: 0 }}
            eventHandlers={{
              click: () => props.onSelectPoint?.(point.id),
            }}
          />
        ))}
        {props.points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={point.id === props.selectedPointId ? 12 : 8}
            pathOptions={{
              color:
                point.id === props.selectedPointId
                  ? MAP.colors.selected
                  : MAP.colors.marker,
              fillColor: mapPointColor(point.id),
              fillOpacity: 1,
              weight: 3,
            }}
            eventHandlers={{
              click: () => props.onSelectPoint?.(point.id),
            }}
          />
        ))}
        {props.draftPlace && (
          <CircleMarker
            center={[props.draftPlace.lat, props.draftPlace.lng]}
            radius={10}
            pathOptions={{ color: MAP.colors.draft, fillOpacity: 0.5 }}
          />
        )}
        {props.currentPosition && (
          <Marker
            position={[props.currentPosition.lat, props.currentPosition.lng]}
            icon={travelerIcon}
            title="Текущее положение путешественника"
            alt="Путешественник"
            interactive={false}
            keyboard={false}
          />
        )}
      </MapContainer>
      {props.onPlace && (
        <p className="pointer-events-none absolute top-3 right-3 z-[1000] max-w-52 rounded-lg bg-background px-3 py-2 text-sm">
          Нажмите на карту, чтобы выбрать место
        </p>
      )}
      {transports.length > 0 && !failed && (
        <ul
          className="pointer-events-none absolute left-3 z-[1000] grid gap-1.5 rounded-lg bg-surface/95 px-3 py-2 text-xs "
          style={{ bottom: `calc(1.5rem + ${props.overlayInset ?? 0}px)` }}
        >
          {transports.map((transport) => (
            <li key={transport} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="w-6"
                style={{
                  borderTopColor: TRANSPORT_STYLES[transport].color,
                  borderTopStyle: TRANSPORT_STYLES[transport].dashArray
                    ? "dashed"
                    : "solid",
                  borderTopWidth: 3,
                }}
              />
              {TRANSPORT_TYPES[transport]}
            </li>
          ))}
        </ul>
      )}
      {(failed || !online) && (
        <div
          role="alert"
          className="absolute right-3 left-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background p-3 text-sm"
          style={{ bottom: `calc(2rem + ${props.overlayInset ?? 0}px)` }}
        >
          <span>
            {online
              ? "Не удалось загрузить карту. Маршрут доступен в хронологии и панели маршрута."
              : OFFLINE.cacheTiles
                ? "Вы оффлайн. Доступны сохранённые участки карты, точки и маршруты поездки."
                : "Вы оффлайн. Точки и маршруты доступны; подложке карты нужен интернет."}
          </span>
          <Button
            variant="outline"
            className="h-11"
            onClick={() => {
              setFailed(false);
              setAttempt(attempt + 1);
            }}
          >
            Повторить
          </Button>
        </div>
      )}
    </section>
  );
}
