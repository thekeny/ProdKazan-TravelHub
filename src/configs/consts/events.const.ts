export const EVENT_TYPES = {
  walk: "Прогулка",
  tour: "Экскурсия",
  stay: "Проживание",
  restaurant: "Ресторан",
  meeting: "Встреча",
  other: "Другое",
} as const;

export const EVENT_COLORS: Record<keyof typeof EVENT_TYPES, string> = {
  walk: "var(--event-walk)",
  tour: "var(--event-tour)",
  stay: "var(--event-stay)",
  restaurant: "var(--event-restaurant)",
  meeting: "var(--event-meeting)",
  other: "var(--event-other)",
};
