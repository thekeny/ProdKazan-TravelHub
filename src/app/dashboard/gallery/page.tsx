import type { Metadata } from "next";
import { TripGallery } from "@/components/dashboard/trip-gallery";

export const metadata: Metadata = {
  title: "Галерея",
};

export default function Page() {
  return <TripGallery kind="photo" />;
}
