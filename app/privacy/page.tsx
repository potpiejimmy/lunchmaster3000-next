import AppShell from "@/src/providers/AppShell";
import AppProviders from "@/src/providers/AppProviders";
import Privacy from "@/src/routes/Privacy";

export default function PrivacyPage() {
  return (
    <AppProviders>
      <AppShell>
        <Privacy />
      </AppShell>
    </AppProviders>
  );
}
