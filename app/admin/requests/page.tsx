import { AdminClient } from "@/components/AdminClient";

export default function AdminRequestsPage() {
  return (
    <div className="site-shell">
      <AdminClient initialTab="requests" />
    </div>
  );
}
