import AppShell from "@/src/providers/AppShell";
import AppProviders from "@/src/providers/AppProviders";
import Create from "@/src/routes/Create";

export default function CreatePage() {
  return (
    <AppProviders>
      <AppShell>
        <Create />
      </AppShell>
    </AppProviders>
  );
}
