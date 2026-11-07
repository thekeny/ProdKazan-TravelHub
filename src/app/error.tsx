"use client";

import { useEffect } from "react";
import { ServerError } from "@/components/layout/server-error";
import { ApiError } from "@/lib/travel-api";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ServerError status={error instanceof ApiError ? error.status : 0} />;
}
