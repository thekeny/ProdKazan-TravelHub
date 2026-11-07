import type { Metadata } from "next";
import { AuthGuard } from "@/components/layout/auth-guard";
export const metadata: Metadata = {
  title: "Мои путешествия",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
