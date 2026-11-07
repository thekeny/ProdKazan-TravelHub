import { MobileNavigation } from "@/components/dashboard/mobile-navigation";
import { PushPrompt } from "@/components/dashboard/push-prompt";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TripSwitcher } from "@/components/dashboard/trip-switcher";
import { UserSettingsButton } from "@/components/dashboard/user-settings-button";
import { Logo } from "@/components/layout/logo";
import { OfflineBanner } from "@/components/layout/offline-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-y-auto bg-surface/60 backdrop-blur lg:block">
        <Sidebar />
      </aside>
      <div className="flex min-h-0 flex-1 flex-col lg:ml-72">
        <OfflineBanner />
        <PushPrompt />
        <header className="flex shrink-0 items-center gap-3 bg-background px-3 py-2 lg:hidden">
          <Logo />
          <div className="ml-auto w-52 min-w-0 max-w-[55%]">
            <TripSwitcher compact />
          </div>
          <UserSettingsButton />
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        <MobileNavigation />
      </div>
    </div>
  );
}
