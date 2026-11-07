"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { pages } from "@/configs/paths/pages.path";
import { useFormValues } from "@/hooks/use-form-values";
import { authErrors } from "@/lib/form-validation";
import { useTravel } from "@/providers/travel-provider";

export function useAuthForm() {
  const { ready, username, login, remote, storageWarning } = useTravel();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const errorId = useId();
  const [values, setValues, form] = useFormValues(
    { username: "", password: "", confirm: "" },
    (values) => authErrors(values, Boolean(remote), mode === "register"),
  );
  useEffect(() => {
    document.title = mode === "login" ? "Вход" : "Регистрация";
  }, [mode]);
  useEffect(() => {
    if (ready && username) router.replace(pages.TRIPS);
  }, [ready, username, router]);
  return {
    ready,
    remote,
    storageWarning,
    mode,
    setMode,
    error,
    setError,
    pending,
    setPending,
    pendingRef,
    errorId,
    values,
    setValues,
    form,
    login,
    router,
  };
}
