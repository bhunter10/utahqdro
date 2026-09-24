import { AdminClient } from "@/components/AdminClient";

export default function AdminFieldsPage() {
  return (
    <div className="site-shell">
      <AdminClient initialTab="fields" />
    </div>
  );
}
