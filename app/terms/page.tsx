import AppShell from "@/src/providers/AppShell";
import AppProviders from "@/src/providers/AppProviders";
import Terms from "@/src/routes/Terms";

export default function TermsPage() {
  return (
    <AppProviders>
      <AppShell>
        <Terms />
      </AppShell>
    </AppProviders>
  );
}
