import { AdminClient } from "@/components/AdminClient";

export default function AdminTemplatesPage() {
  return (
    <div className="site-shell">
      <AdminClient initialTab="templates" />
    </div>
  );
}
