"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountMenu } from "@/components/dashboard/account-menu";
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
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <AccountMenu />
        </div>
        <Link
          href={pages.TRIPS}
          className="mt-7 flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />К путешествиям
        </Link>
        <h1 className="mt-4 text-4xl leading-tight">Новое путешествие</h1>
        <div className="mt-6">
          <TripForm
            submitLabel="Создать путешествие"
            onSubmit={async (values) => {
              await createTrip(values);
              router.push(pages.DASHBOARD);
            }}
          />
        </div>
      </section>
    </main>
  );
}
