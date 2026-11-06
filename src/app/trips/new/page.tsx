"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { TripForm } from "@/components/trips/trip-form";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";

export default function Page() {
  const { createTrip } = useTravel();
  const router = useRouter();
  return (
    <main className="flow-background">
      <section className="flow-card max-w-2xl">
        <Logo />
        <Link
          href={pages.TRIPS}
          className="mt-7 flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />К путешествиям
        </Link>
        <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-primary-strong uppercase">
          Новая глава
        </p>
        <h1 className="mt-2 text-4xl leading-tight">Новое путешествие</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Название, даты и обложка помогут узнать поездку среди других.
        </p>
        <div className="mt-6">
          <TripForm
            submitLabel="Создать путешествие"
            onSubmit={(values) => {
              createTrip(values);
              router.push(pages.DASHBOARD);
            }}
          />
        </div>
      </section>
    </main>
  );
}
