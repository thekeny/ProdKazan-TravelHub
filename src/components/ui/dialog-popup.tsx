"use client";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

function hasClose(node: ReactNode): boolean {
  return Children.toArray(node).some(
    (child) =>
      isValidElement<{ children?: ReactNode; "aria-label"?: string }>(child) &&
      (child.props["aria-label"]?.startsWith("Закрыть") ||
        hasClose(child.props.children)),
  );
}

export function DialogPopup({
  children,
  ...props
}: ComponentProps<typeof Dialog.Popup>) {
  return (
    <Dialog.Popup {...props}>
      {children}
      {!hasClose(children) && (
        <Dialog.Close
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 size-11"
              aria-label="Закрыть окно"
            />
          }
        >
          <X className="size-4" />
        </Dialog.Close>
      )}
    </Dialog.Popup>
  );
}
