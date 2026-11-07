"use client";

import { useEffect } from "react";
import { ServerError } from "@/components/layout/server-error";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ServerError />;
}
