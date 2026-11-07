import type { Metadata } from "next";
import { AuthGuard } from "@/components/layout/auth-guard";
import { OfflineBanner } from "@/components/layout/offline-banner";
export const metadata: Metadata = {
  title: "Мои путешествия",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OfflineBanner />
      {children}
    </AuthGuard>
  );
}
