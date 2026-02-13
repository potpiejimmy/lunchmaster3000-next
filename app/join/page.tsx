import AppShell from "@/src/providers/AppShell";
import AppProviders from "@/src/providers/AppProviders";
import Join from "@/src/routes/Join";

export default function JoinPage() {
  return (
    <AppProviders>
      <AppShell>
        <Join />
      </AppShell>
    </AppProviders>
  );
}
