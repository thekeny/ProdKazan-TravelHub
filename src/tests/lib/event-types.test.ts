import { afterEach, expect, it } from "vitest";
import {
  EVENT_TYPE_LIMITS,
  TEXT_LIMITS,
} from "@/configs/consts/validation.const";
import {
  appendEventType,
  eventTypeLabel,
  eventTypesError,
} from "@/lib/event-types";
import { eventErrors } from "@/lib/form-validation";
import {
  readRemotePreferences,
  writeRemotePreferences,
} from "@/lib/remote-preferences";

afterEach(() => {
  localStorage.clear();
});
it("rejects blank, duplicate, oversized and excess new types", () => {
  expect(() => appendEventType([], "  ")).toThrow();
  expect(() => appendEventType(["Музей"], " музей ")).toThrow("уже добавлен");
  expect(() =>
    appendEventType([], "а".repeat(TEXT_LIMITS.EVENT_TYPE + 1)),
  ).toThrow();
  expect(() =>
    appendEventType(
      Array.from({ length: EVENT_TYPE_LIMITS.PER_TRIP }, (_, i) => `Тип ${i}`),
      "Новый",
    ),
  ).toThrow("Не больше");
});
it("restores separate trip catalogs and one selected event type, scoped to the server account", () => {
  writeRemotePreferences("a", {
    activeId: null,
    materials: {},
    tripEventTypes: { tripA: ["Кофе"], tripB: ["Музей"] },
    eventTypes: { event: "Кофе" },
  });
  expect(readRemotePreferences("a").eventTypes).toEqual({
    event: "Кофе",
  });
  expect(readRemotePreferences("a").tripEventTypes).toEqual({
    tripA: ["Кофе"],
    tripB: ["Музей"],
  });
  expect(readRemotePreferences("b").tripEventTypes).toBeUndefined();
  expect(eventTypesError(["Кофе", "кофе"])).toBeTruthy();
  expect(eventTypeLabel({ type: "tour" })).toBe("Экскурсия");
  expect(eventTypeLabel({ type: "other", customType: "Кофе" })).toBe("Кофе");
});

it("accepts only this trip's types while preserving removed types on existing events", () => {
  const trip = {
    name: "Поездка",
    description: "",
    startDate: "2026-11-07",
    endDate: "2026-11-08",
    cover: null,
    eventTypes: ["Кофе"],
  };
  const event = {
    title: "Утро",
    type: "other" as const,
    customType: "Музей",
    start: "2026-11-07T10:00",
    end: "",
    description: "",
    pointId: null,
    materials: [],
    bookingUrl: "",
  };
  expect(eventErrors(event, trip, []).customType).toBeTruthy();
  expect(
    eventErrors({ ...event, customType: "Кофе" }, trip, []).customType,
  ).toBeUndefined();
  expect(
    eventErrors({ ...event, customType: null }, trip, []).customType,
  ).toBeUndefined();
  expect(
    eventErrors(event, trip, [], { initial: event }).customType,
  ).toBeUndefined();
});
