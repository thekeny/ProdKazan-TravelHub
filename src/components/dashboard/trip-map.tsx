"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Button } from "@/components/ui/button";
import { MAP } from "@/configs/consts/map.const";
import type { EventPlace, TripEvent } from "@/configs/types/event.type";

type Props = {
  events: TripEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPlace?: (place: EventPlace) => void;
  draftPlace?: EventPlace | null;
};

function MapBehavior({ events, selectedId, onPlace }: Props) {
  const map = useMap();
  useMapEvents({
    click(event) {
      onPlace?.({
        name: "Выбранное место",
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
    const points = events.flatMap((event) =>
      event.place
        ? [[event.place.lat, event.place.lng] as [number, number]]
        : [],
    );
    if (points.length)
      map.fitBounds(points, { padding: [40, 40], maxZoom: MAP.pointZoom });
    else map.setView(MAP.center, MAP.zoom);
  }, [events, map, onPlace]);
  useEffect(() => {
    const place = events.find((event) => event.id === selectedId)?.place;
    if (place) map.panTo([place.lat, place.lng]);
  }, [selectedId, events, map]);
  return null;
}

export default function TripMap(props: Props) {
  const [initialView] = useState(() => ({
    center: props.draftPlace
      ? ([props.draftPlace.lat, props.draftPlace.lng] as [number, number])
      : MAP.center,
    zoom: props.draftPlace ? MAP.pointZoom : MAP.zoom,
  }));
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <section
      className="relative isolate h-[360px] overflow-hidden rounded-xl border bg-muted sm:h-[500px] xl:h-[640px]"
      aria-label="Карта событий поездки"
    >
      <MapContainer
        center={initialView.center}
        zoom={initialView.zoom}
        className="h-full w-full"
      >
        <TileLayer
          key={attempt}
          url={MAP.tiles}
          attribution={MAP.attribution}
          eventHandlers={{ tileerror: () => setFailed(true) }}
        />
        <MapBehavior {...props} />
        {props.events.map(
          (event) =>
            event.place && (
              <CircleMarker
                key={event.id}
                center={[event.place.lat, event.place.lng]}
                radius={event.id === props.selectedId ? 12 : 8}
                pathOptions={{
                  color:
                    event.id === props.selectedId
                      ? MAP.colors.selected
                      : MAP.colors.marker,
                  fillColor: MAP.colors.fill,
                  fillOpacity: 1,
                  weight: 3,
                }}
                eventHandlers={{
                  click: () => {
                    if (!props.onPlace) props.onSelect(event.id);
                  },
                }}
              >
                <Popup autoPan={false}>
                  {event.title}
                  <br />
                  {event.place.name}
                </Popup>
              </CircleMarker>
            ),
        )}
        {props.draftPlace && (
          <CircleMarker
            center={[props.draftPlace.lat, props.draftPlace.lng]}
            radius={10}
            pathOptions={{ color: MAP.colors.draft, fillOpacity: 0.5 }}
          />
        )}
      </MapContainer>
      {props.onPlace && (
        <p className="pointer-events-none absolute top-3 right-3 z-[1000] max-w-52 rounded-lg bg-background px-3 py-2 text-sm shadow">
          Нажмите на карту, чтобы выбрать место
        </p>
      )}
      {failed && (
        <div
          role="alert"
          className="absolute right-3 bottom-8 left-3 z-[1000] flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-3 text-sm"
        >
          <span>Не удалось загрузить карту. События доступны в ленте.</span>
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
