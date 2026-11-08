import { AccountMenu } from "@/components/dashboard/account-menu";
import { Logo } from "@/components/layout/logo";
import { StorageWarning } from "@/components/layout/storage-warning";
import { TripList } from "@/components/trips/trip-list";

export default function Page() {
  return (
    <main className="flow-background">
      <section className="flow-card max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <AccountMenu />
        </div>
        <h1 className="mt-8 text-4xl leading-tight sm:text-5xl">
          Ваши путешествия
        </h1>
        <StorageWarning className="mt-4" />
        <TripList />
      </section>
    </main>
  );
}
