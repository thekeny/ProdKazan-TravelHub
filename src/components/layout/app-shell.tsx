"use client";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-muted/50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-y-auto border-r bg-background lg:block">
        <Sidebar />
      </aside>
      <div className="lg:pl-72">
        <header className="flex h-20 items-center justify-between border-b bg-background px-5 lg:hidden">
          <Logo />
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              render={<Button variant="outline" className="size-11" />}
              aria-label="Открыть меню"
            >
              <Menu />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/30" />
              <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] overflow-y-auto bg-background outline-none">
                <Dialog.Title className="sr-only">Навигация</Dialog.Title>
                <Dialog.Close
                  render={
                    <Button
                      variant="ghost"
                      className="absolute top-3 right-3 size-11"
                    />
                  }
                  aria-label="Закрыть меню"
                >
                  <X />
                </Dialog.Close>
                <div className="h-full">
                  <Sidebar onNavigate={() => setOpen(false)} />
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </header>
        <main className="p-6 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
