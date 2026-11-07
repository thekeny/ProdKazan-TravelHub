import type { Metadata } from "next";
export const metadata: Metadata = { title: "Обзор" };

import { TripOverview } from "@/components/dashboard/trip-overview";

export default function Page() {
  return <TripOverview />;
}
