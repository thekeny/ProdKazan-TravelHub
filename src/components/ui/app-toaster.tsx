"use client";
import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      containerStyle={{ zIndex: 80 }}
      toastOptions={{
        className: "!bg-surface !text-foreground !font-sans !rounded-xl",
        ariaProps: { role: "status", "aria-live": "polite" },
        style: { minWidth: "min(20rem, 90vw)" },
        iconTheme: {
          primary: "var(--primary-strong)",
          secondary: "var(--surface)",
        },
      }}
    />
  );
}
