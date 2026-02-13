import AppShell from "@/src/providers/AppShell";
import AppProviders from "@/src/providers/AppProviders";
import Welcome from "@/src/routes/Welcome";

export default function WelcomePage() {
  return (
    <AppProviders>
      <AppShell>
        <Welcome />
      </AppShell>
    </AppProviders>
  );
}
