import { AdminClient } from "@/components/AdminClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <AdminClient />
      {children}
    </div>
  );
}
