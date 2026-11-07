"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAVIGATION } from "@/configs/consts/navigation.const";

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Навигация по путешествию"
      className="grid shrink-0 grid-cols-3 gap-1 bg-surface px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      {MOBILE_NAVIGATION.map(({ href, mobileLabel, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-ring ${active ? "bg-secondary text-primary-strong" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{mobileLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
