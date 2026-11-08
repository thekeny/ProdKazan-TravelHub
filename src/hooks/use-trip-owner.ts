"use client";
import { useEffect, useRef, useState } from "react";
import { useTravel } from "@/providers/travel-provider";
export function useTripOwner(tripId: string) {
  const { user, username, loadCollaborators } = useTravel();
  const load = useRef(loadCollaborators);
  load.current = loadCollaborators;
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const identity = user?.id ?? username;
  const key = `${identity}:${tripId}`;
  useEffect(() => {
    let active = true;
    load
      .current(tripId)
      .then(({ owner }) => {
        const isOwner =
          user?.id && owner.id
            ? user.id === owner.id
            : owner.username === username;
        if (active) setOwnerKey(isOwner ? key : null);
      })
      .catch(() => {
        if (active) setOwnerKey(null);
      });
    return () => {
      active = false;
    };
  }, [tripId, user?.id, username, key]);
  return ownerKey === key;
}
