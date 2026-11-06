export default function Loading() {
  return (
    <main className="flow-background">
      <section className="flow-card animate-pulse">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="mt-9 h-9 w-64 rounded bg-muted" />
        <div className="mt-3 h-4 w-full rounded bg-muted" />
        <div className="mt-7 grid gap-3">
          <div className="h-20 rounded-lg bg-muted" />
          <div className="h-20 rounded-lg bg-muted" />
        </div>
        <span className="sr-only">Загрузка путешествий…</span>
      </section>
    </main>
  );
}
