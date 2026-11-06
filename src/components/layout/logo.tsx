import Image from "next/image";
import Link from "next/link";
import { APP } from "@/configs/consts/app.const";
import { images } from "@/configs/paths/images.path";
import { pages } from "@/configs/paths/pages.path";
export function Logo({ large = false }: { large?: boolean }) {
  return (
    <Link
      href={pages.ROOT}
      aria-label={`${APP.NAME} — главная`}
      className="inline-flex shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <Image
        src={images.LOGO}
        alt={APP.NAME}
        width={2048}
        height={523}
        priority
        className={`${large ? "w-72 sm:w-96" : "w-32 sm:w-40"} h-auto`}
      />
    </Link>
  );
}
