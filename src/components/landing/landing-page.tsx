"use client";

import {
  ArrowRight,
  CalendarDays,
  Images,
  Route as RouteIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { RoutePreview } from "@/components/landing/route-preview";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { LANDING } from "@/configs/consts/landing.const";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";

const FEATURE_ICONS = [RouteIcon, CalendarDays, Images] as const;

export function LandingPage() {
  const { username, ready } = useTravel();
  const signedIn = ready && !!username;
  const actionHref = signedIn ? pages.TRIPS : pages.LOGIN;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 paper-texture opacity-50" />
      <div className="pointer-events-none absolute -top-40 right-[-10rem] size-[30rem] rounded-full bg-secondary/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] left-[-12rem] size-[28rem] rounded-full bg-water/20 blur-3xl" />

      <header className="relative mx-auto flex h-24 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Logo />
        <Link
          href={actionHref}
          className={buttonVariants({
            variant: "outline",
            className: `h-10 px-4 ${ready ? "" : "pointer-events-none opacity-60"}`,
          })}
        >
          {signedIn ? LANDING.ACTION_USER : LANDING.ACTION_GUEST}
          <ArrowRight />
        </Link>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl gap-14 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pt-14">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary/50 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-primary-strong uppercase">
            <Sparkles aria-hidden="true" className="size-3.5" />
            {LANDING.EYEBROW}
          </p>
          <h1 className="mt-6 text-[3.15rem] leading-[0.96] text-foreground text-balance sm:text-7xl">
            {LANDING.TITLE}
            <span className="mt-1 block w-fit text-primary-strong ink-underline">
              {LANDING.TITLE_ACCENT}
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">
            {LANDING.DESCRIPTION}
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href={actionHref}
              aria-disabled={!ready}
              className={buttonVariants({
                className: `h-12 px-6 text-base ${ready ? "" : "pointer-events-none opacity-60"}`,
              })}
            >
              {signedIn ? LANDING.ACTION_USER : LANDING.ACTION_GUEST}
              <ArrowRight aria-hidden="true" />
            </Link>
            <span className="text-xs leading-5 text-muted-foreground">
              {LANDING.ACTION_NOTE}
            </span>
          </div>
        </div>

        <RoutePreview />
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {LANDING.FEATURES.map((feature, index) => {
            const Icon = FEATURE_ICONS[index];
            return (
              <article
                key={feature.title}
                className="group rounded-3xl border border-border/70 bg-card/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-text/5"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-secondary/60 text-primary-strong transition-colors duration-300 group-hover:bg-primary-strong group-hover:text-primary-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h2 className="mt-4 text-xl leading-tight">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-primary-strong/20 bg-primary-strong p-7 text-primary-foreground shadow-2xl shadow-primary-strong/20 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-70">
              TravelHub
            </p>
            <p className="mt-2 max-w-xl text-3xl leading-tight sm:text-4xl">
              {LANDING.RIBBON}
            </p>
          </div>
          <Link
            href={actionHref}
            aria-disabled={!ready}
            className={buttonVariants({
              variant: "outline",
              className: `h-12 shrink-0 border-transparent bg-background px-6 text-base text-primary-strong hover:bg-background/90 ${ready ? "" : "pointer-events-none opacity-60"}`,
            })}
          >
            {signedIn ? LANDING.ACTION_USER : LANDING.ACTION_GUEST}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="relative mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-border/60 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>TravelHub · дневник путешествий</p>
        <p>Демо-режим: данные хранятся только в вашем браузере.</p>
      </footer>
    </main>
  );
}
