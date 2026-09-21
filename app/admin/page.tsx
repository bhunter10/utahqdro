import { AdminClient } from "@/components/AdminClient";
import { SiteHeader } from "@/components/SiteHeader";

export default function AdminPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <AdminClient />
    </div>
  );
}
