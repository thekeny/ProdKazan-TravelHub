import { FileText, Images, LayoutDashboard } from "lucide-react";
import { pages } from "@/configs/paths/pages.path";

export const TRIP_NAVIGATION = [
  {
    href: pages.DASHBOARD,
    label: "Обзор",
    mobileLabel: "Обзор",
    icon: LayoutDashboard,
  },
  {
    href: pages.GALLERY,
    label: "Галерея",
    mobileLabel: "Галерея",
    icon: Images,
  },
  {
    href: pages.DOCUMENTS,
    label: "Билеты и документы",
    mobileLabel: "Билеты и документы",
    icon: FileText,
  },
] as const;

export const MOBILE_NAVIGATION = TRIP_NAVIGATION;
