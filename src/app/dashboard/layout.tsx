import { AppShell } from "@/components/dashboard/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireTrip>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
