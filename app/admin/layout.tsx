import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminProfile } from "@/lib/admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Gay Bar Passport",
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminProfile();

  return (
    <section className="container py-10 md:py-14">
      <AdminNav role={admin.role} />
      {children}
    </section>
  );
}
