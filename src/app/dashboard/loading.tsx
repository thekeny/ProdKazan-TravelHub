export default function Loading() {
  return (
    <div className="grid h-dvh gap-4 bg-background p-4 lg:grid-cols-[18rem_1fr]">
      <div className="hidden animate-pulse rounded-xl bg-muted lg:block" />
      <div className="grid gap-4">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="animate-pulse rounded-xl bg-muted" />
      </div>
      <span className="sr-only">Загрузка путешествия…</span>
    </div>
  );
}
