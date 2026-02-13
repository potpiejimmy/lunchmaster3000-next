import AppShell from "@/src/providers/AppShell";
import AppProviders from "@/src/providers/AppProviders";
import XrpTip from "@/src/routes/XrpTip";

export default function XrpTipPage() {
  return (
    <AppProviders>
      <AppShell>
        <XrpTip />
      </AppShell>
    </AppProviders>
  );
}
