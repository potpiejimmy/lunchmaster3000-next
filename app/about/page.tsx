import AppShell from "@/src/providers/AppShell";
import AppProviders from "@/src/providers/AppProviders";
import About from "@/src/routes/About";

export default function AboutPage() {
  return (
    <AppProviders>
      <AppShell>
        <About />
      </AppShell>
    </AppProviders>
  );
}
