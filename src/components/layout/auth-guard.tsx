"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";
export function AuthGuard({
  children,
  requireTrip = false,
}: {
  children: React.ReactNode;
  requireTrip?: boolean;
}) {
  const { ready, username, trips, activeId } = useTravel();
  const router = useRouter();
  const hasTrip = trips.some((trip) => trip.id === activeId);
  useEffect(() => {
    if (!ready) return;
    if (!username) router.replace(pages.LOGIN);
    else if (requireTrip && !hasTrip) router.replace(pages.TRIPS);
  }, [ready, username, requireTrip, hasTrip, router]);
  if (!ready || !username || (requireTrip && !hasTrip))
    return (
      <output className="grid min-h-dvh place-items-center text-sm text-muted-foreground">
        Загрузка…
      </output>
    );
  return children;
}
