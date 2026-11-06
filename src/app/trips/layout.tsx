import { AuthGuard } from "@/components/layout/auth-guard";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
