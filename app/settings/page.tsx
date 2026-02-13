import AppShell from "@/src/providers/AppShell";
import AppProviders from "@/src/providers/AppProviders";
import Settings from "@/src/routes/Settings";

export default function SettingsPage() {
  return (
    <AppProviders>
      <AppShell>
        <Settings />
      </AppShell>
    </AppProviders>
  );
}
