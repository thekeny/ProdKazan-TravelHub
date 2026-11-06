"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { LANDING } from "@/configs/consts/landing.const";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";

export function LandingPage() {
  const { username, ready } = useTravel();
  const signedIn = ready && !!username;
  const actionHref = signedIn ? pages.TRIPS : pages.LOGIN;

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex h-20 w-full max-w-5xl items-center px-6">
        <Logo />
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-16">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl sm:leading-[1.1]">
            {LANDING.TITLE}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            {LANDING.DESCRIPTION}
          </p>
          <Link
            href={actionHref}
            aria-disabled={!ready}
            className={buttonVariants({
              className: `mt-8 h-12 px-6 ${ready ? "" : "pointer-events-none opacity-60"}`,
            })}
          >
            {signedIn ? LANDING.ACTION_USER : LANDING.ACTION_GUEST}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
