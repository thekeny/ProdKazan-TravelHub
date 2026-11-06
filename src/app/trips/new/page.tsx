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
      <section className="flow-card">
        <Logo />
        <Link
          href={pages.TRIPS}
          className="mt-7 flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />К путешествиям
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Новое путешествие
        </h1>
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
