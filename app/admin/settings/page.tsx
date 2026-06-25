export const dynamic = "force-dynamic";
export const metadata = { title: "General Settings — Hirewex Admin" };

import { DashboardShell } from "@/components/layout/DashboardShell";
import { getSetting } from "@/app/actions/platform-settings";
import { SettingsClient } from "./SettingsClient";

export default async function AdminSettingsPage() {
  const serviceFeePercent = await getSetting("service_fee_percent", "5");

  return (
    <DashboardShell title="General Settings" role="admin">
      <SettingsClient serviceFeePercent={serviceFeePercent} />
    </DashboardShell>
  );
}
