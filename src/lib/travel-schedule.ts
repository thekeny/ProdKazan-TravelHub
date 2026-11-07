import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import { formatEventDate } from "@/lib/travel-events";

export type ScheduleIssue = {
  id: string;
  day: string;
  title: string;
  description: string;
  itemIds: string[];
};

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

function pointName(points: readonly RoutePoint[], id: string) {
  return points.find((point) => point.id === id)?.name ?? "точка удалена";
}

/** Ищет конфликты расписания, не блокируя сохранение данных. */
export function findScheduleIssues(
  events: readonly TripEvent[],
  legs: readonly TripLeg[],
  points: readonly RoutePoint[],
): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];
  const seen = new Set<string>();
  const add = (issue: ScheduleIssue) => {
    if (seen.has(issue.id)) return;
    seen.add(issue.id);
    issues.push(issue);
  };

  for (let index = 0; index < events.length; index += 1) {
    for (let next = index + 1; next < events.length; next += 1) {
      const a = events[index];
      const b = events[next];
      if (!a.end || !b.end) continue;
      if (!overlaps(a.start, a.end, b.start, b.end)) continue;
      add({
        id: `events-${a.id}-${b.id}`,
        day: a.start.slice(0, 10),
        title: "События пересекаются",
        description: `«${a.title}» и «${b.title}» идут одновременно (${formatEventDate(a.start)}).`,
        itemIds: [a.id, b.id],
      });
    }
  }

  for (let index = 0; index < legs.length; index += 1) {
    for (let next = index + 1; next < legs.length; next += 1) {
      const a = legs[index];
      const b = legs[next];
      if (!overlaps(a.start, a.end, b.start, b.end)) continue;
      add({
        id: `legs-${a.id}-${b.id}`,
        day: a.start.slice(0, 10),
        title: "Перемещения пересекаются",
        description: `${pointName(points, a.fromPointId)} → ${pointName(points, a.toPointId)} и ${pointName(points, b.fromPointId)} → ${pointName(points, b.toPointId)} идут одновременно.`,
        itemIds: [a.id, b.id],
      });
    }
  }

  const orderedLegs = [...legs].sort(
    (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
  );
  for (let index = 1; index < orderedLegs.length; index += 1) {
    const previous = orderedLegs[index - 1];
    const current = orderedLegs[index];
    if (previous.end <= current.start) continue;
    add({
      id: `leg-order-${previous.id}-${current.id}`,
      day: current.start.slice(0, 10),
      title: "Нарушена последовательность перемещений",
      description: `Следующее перемещение начинается раньше, чем закончилось предыдущее (${formatEventDate(current.start)}).`,
      itemIds: [previous.id, current.id],
    });
  }

  for (const leg of legs) {
    for (const event of events) {
      if (event.pointId !== leg.toPointId) continue;
      if (event.start.slice(0, 10) !== leg.start.slice(0, 10)) continue;
      if (event.start >= leg.end) continue;
      add({
        id: `leg-event-${leg.id}-${event.id}`,
        day: event.start.slice(0, 10),
        title: "Событие начинается до прибытия",
        description: `«${event.title}» запланировано в ${pointName(points, event.pointId)} до прибытия в ${pointName(points, leg.toPointId)}.`,
        itemIds: [leg.id, event.id],
      });
    }
  }

  return issues.sort(
    (a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title),
  );
}
