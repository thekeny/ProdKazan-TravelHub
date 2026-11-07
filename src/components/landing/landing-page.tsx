"use client";

import {
  ArrowRight,
  CalendarDays,
  Images,
  Route as RouteIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/layout/loading-state";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { LANDING } from "@/configs/consts/landing.const";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";

const FEATURE_ICONS = [RouteIcon, CalendarDays, Images] as const;

export function LandingPage() {
  const { username, ready } = useTravel();
  const router = useRouter();
  useEffect(() => {
    if (ready && username) router.replace(pages.DASHBOARD);
  }, [ready, username, router]);
  const signedIn = ready && !!username;
  const actionHref = signedIn ? pages.TRIPS : pages.LOGIN;
  const actionLabel = signedIn ? LANDING.ACTION_USER : LANDING.ACTION_GUEST;
  const navLabel = signedIn ? LANDING.NAV_USER : LANDING.NAV_GUEST;

  if (!ready || username) return <LoadingState />;
  return (
    <main className="min-h-dvh bg-background paper-texture">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between gap-6 px-6">
          <Logo />
          <Link
            href={actionHref}
            aria-disabled={!ready}
            tabIndex={ready ? undefined : -1}
            className={buttonVariants({
              variant: "ghost",
              className: `h-10 px-3 text-muted-foreground hover:text-foreground ${ready ? "" : "pointer-events-none opacity-60"}`,
            })}
          >
            {navLabel}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-6 pt-16 pb-20 text-center lg:pt-24 lg:pb-28">
        <h1 className="mx-auto max-w-2xl text-[3rem] leading-[0.95] text-balance text-foreground sm:text-[4.5rem]">
          {LANDING.TITLE}
          <span className="mt-1 block text-primary-strong">
            {LANDING.TITLE_ACCENT}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-muted-foreground">
          {LANDING.DESCRIPTION}
        </p>
        <Link
          href={actionHref}
          aria-disabled={!ready}
          tabIndex={ready ? undefined : -1}
          className={buttonVariants({
            className: `mt-9 h-12 px-6 text-base ${ready ? "" : "pointer-events-none opacity-60"}`,
          })}
        >
          {actionLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 sm:grid-cols-3 sm:gap-10 sm:py-14">
          {LANDING.FEATURES.map((feature, index) => {
            const Icon = FEATURE_ICONS[index];
            if (!ready || username) return <LoadingState />;
            return (
              <div key={feature.title} className="flex gap-3">
                <Icon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <div>
                  <h2 className="font-sans text-sm font-medium text-foreground">
                    {feature.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <footer className="mx-auto flex w-full max-w-5xl justify-between border-t border-border/60 px-6 py-5 text-xs text-muted-foreground">
        <span>© TravelHub</span>
        <span>team №5</span>
      </footer>
    </main>
  );
}
