import { Camera, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import { LANDING } from "@/configs/consts/landing.const";
import { images } from "@/configs/paths/images.path";

const { SAMPLE } = LANDING;

export function RoutePreview() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-[29rem] lg:mr-0"
    >
      <div className="absolute -top-8 -left-5 h-24 w-24 rotate-6 rounded-full border-2 border-dashed border-primary/25 bg-secondary/40" />
      <div className="animate-float-soft absolute -right-3 -bottom-5 z-20 rotate-6 rounded-2xl bg-primary-strong px-4 py-2.5 font-display text-sm text-primary-foreground shadow-lg shadow-primary-strong/25">
        {SAMPLE.STICKER}
      </div>

      <div className="relative -rotate-1 rounded-[2rem] border border-border/70 bg-surface p-5 shadow-2xl shadow-text/10 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-strong">
            {SAMPLE.BADGE}
          </span>
          <span className="font-display text-sm text-muted-foreground">
            {SAMPLE.DATES}
          </span>
        </div>

        <h2 className="mt-4 text-2xl leading-tight text-foreground sm:text-[1.65rem]">
          {SAMPLE.TITLE}
        </h2>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-border/60 bg-secondary/30 p-4 paper-texture">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 shadow-sm">
              <MapPin className="size-3 text-primary" />
              маршрут
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 shadow-sm">
              <Camera className="size-3 text-primary" />
              фото
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 shadow-sm">
              <Ticket className="size-3 text-primary" />
              билеты
            </span>
          </div>

          <svg
            viewBox="0 0 320 132"
            className="mt-1 h-32 w-full"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M22 105C72 108 65 38 137 49C209 60 194 110 298 28"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeDasharray="6 8"
              strokeLinecap="round"
            />
            <circle
              cx="22"
              cy="105"
              r="5"
              fill="var(--surface)"
              stroke="var(--primary)"
              strokeWidth="3"
            />
            <circle
              cx="137"
              cy="49"
              r="5"
              fill="var(--surface)"
              stroke="var(--water)"
              strokeWidth="3"
            />
            <circle
              cx="298"
              cy="28"
              r="6"
              fill="var(--primary-strong)"
              stroke="var(--surface)"
              strokeWidth="3"
            />
          </svg>

          <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[10px] leading-tight text-muted-foreground">
            {SAMPLE.STOPS.map((stop) => (
              <span key={stop} className="min-w-0 truncate px-0.5">
                {stop}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-foreground/80">
          {SAMPLE.NOTE}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-dashed border-border/80 bg-background/60 p-3 text-center">
          {SAMPLE.STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-display text-2xl leading-none text-primary-strong">
                  {stat.value}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <Image
        src={images.ICON}
        alt=""
        width={658}
        height={658}
        sizes="80px"
        className="absolute -bottom-7 -left-5 size-20 -rotate-6 drop-shadow-xl"
      />
    </div>
  );
}
