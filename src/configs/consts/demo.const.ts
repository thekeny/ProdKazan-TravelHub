import type { TransportKind } from "@/configs/consts/transport.const";

export const DEMO_TRIP = {
  name: "Санкт-Петербург → Казань",
  description:
    "Четыре дня: перелёт, прогулки по Кремлю, набережная и ужины. Демонстрационная поездка, которую можно свободно менять.",
  durationDays: 4,
} as const;

export const DEMO_USER = "demo";

export const DEMO_POINTS = [
  {
    key: "spb-station",
    name: "Московский вокзал",
    description: "Старт путешествия в Санкт-Петербурге.",
    lat: 59.9296,
    lng: 30.3614,
  },
  {
    key: "pulkovo",
    name: "Аэропорт Пулково",
    description: "Вылет в Казань.",
    lat: 59.8003,
    lng: 30.2625,
  },
  {
    key: "kazan-airport",
    name: "Аэропорт Казани",
    description: "Прибытие рейса из Санкт-Петербурга.",
    lat: 55.6062,
    lng: 49.2787,
  },
  {
    key: "hotel",
    name: "Гостиница у Кремля",
    description: "Заселение и отдых после дороги.",
    lat: 55.7963,
    lng: 49.1064,
  },
  {
    key: "kremlin",
    name: "Казанский Кремль",
    description: "Главная достопримечательность города.",
    lat: 55.7985,
    lng: 49.1052,
  },
  {
    key: "bauman",
    name: "Улица Баумана",
    description: "Прогулка по пешеходной улице.",
    lat: 55.7906,
    lng: 49.1203,
  },
  {
    key: "embankment",
    name: "Набережная озера Кабан",
    description: "Вечерняя прогулка у воды.",
    lat: 55.7798,
    lng: 49.1175,
  },
  {
    key: "restaurant",
    name: "Ресторан татарской кухни",
    description: "Ужин с видом на Кремль.",
    lat: 55.7943,
    lng: 49.1122,
  },
] as const;

export type DemoPointKey = (typeof DEMO_POINTS)[number]["key"];

export const DEMO_LEGS: readonly {
  from: DemoPointKey;
  to: DemoPointKey;
  transport: TransportKind;
  dayOffset: number;
  start: string;
  end: string;
  description: string;
}[] = [
  {
    from: "spb-station",
    to: "pulkovo",
    transport: "car",
    dayOffset: 0,
    start: "07:30",
    end: "08:20",
    description: "Дорога до аэропорта на такси.",
  },
  {
    from: "pulkovo",
    to: "kazan-airport",
    transport: "plane",
    dayOffset: 0,
    start: "10:10",
    end: "11:55",
    description: "Прямой рейс Санкт-Петербург — Казань.",
  },
  {
    from: "kazan-airport",
    to: "hotel",
    transport: "car",
    dayOffset: 0,
    start: "12:20",
    end: "13:10",
    description: "Трансфер до гостиницы.",
  },
  {
    from: "hotel",
    to: "kremlin",
    transport: "walk",
    dayOffset: 1,
    start: "09:40",
    end: "10:00",
    description: "Короткая прогулка до Кремля.",
  },
  {
    from: "kremlin",
    to: "bauman",
    transport: "walk",
    dayOffset: 1,
    start: "13:00",
    end: "13:25",
    description: "Спуск к пешеходной улице.",
  },
  {
    from: "bauman",
    to: "embankment",
    transport: "walk",
    dayOffset: 2,
    start: "17:30",
    end: "17:55",
    description: "Прогулка к набережной.",
  },
  {
    from: "hotel",
    to: "kazan-airport",
    transport: "car",
    dayOffset: 3,
    start: "12:00",
    end: "12:50",
    description: "Возвращение в аэропорт.",
  },
  {
    from: "kazan-airport",
    to: "pulkovo",
    transport: "plane",
    dayOffset: 3,
    start: "14:30",
    end: "16:20",
    description: "Обратный рейс домой.",
  },
];

export const DEMO_EVENTS: readonly {
  title: string;
  type: "walk" | "tour" | "stay" | "restaurant" | "meeting" | "other";
  point: DemoPointKey | null;
  dayOffset: number;
  start: string;
  end: string;
  description: string;
}[] = [
  {
    title: "Заселение в гостиницу",
    type: "stay",
    point: "hotel",
    dayOffset: 0,
    start: "13:30",
    end: "14:30",
    description: "Оставить вещи и немного отдохнуть после перелёта.",
  },
  {
    title: "Ужин в центре",
    type: "restaurant",
    point: "restaurant",
    dayOffset: 0,
    start: "19:00",
    end: "21:00",
    description: "Попробовать эчпочмак и чак-чак.",
  },
  {
    title: "Экскурсия по Кремлю",
    type: "tour",
    point: "kremlin",
    dayOffset: 1,
    start: "10:00",
    end: "12:30",
    description: "Мечеть Кул-Шариф, башня Сююмбике и музей.",
  },
  {
    title: "Прогулка по Баумана",
    type: "walk",
    point: "bauman",
    dayOffset: 1,
    start: "13:30",
    end: "15:30",
    description: "Сувениры и кофе на пешеходной улице.",
  },
  {
    title: "Набережная Кабана",
    type: "walk",
    point: "embankment",
    dayOffset: 2,
    start: "18:00",
    end: "19:30",
    description: "Закат у воды и фотографии.",
  },
  {
    title: "Ужин с друзьями",
    type: "meeting",
    point: "restaurant",
    dayOffset: 2,
    start: "20:00",
    end: "22:00",
    description: "Встреча с друзьями, которые живут в Казани.",
  },
  {
    title: "Сборы и выезд",
    type: "other",
    point: "hotel",
    dayOffset: 3,
    start: "11:00",
    end: "11:45",
    description: "Проверить документы и вызвать такси.",
  },
  {
    title: "Дома",
    type: "other",
    point: "pulkovo",
    dayOffset: 3,
    start: "16:40",
    end: "",
    description: "Вернуться в Санкт-Петербург и сохранить впечатления.",
  },
];
