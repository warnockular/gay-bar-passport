import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const adminRoutes = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/journals", label: "Journals" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit-logs", label: "Audit Logs" }
];

export function AdminNav({ role }: { role: string }) {
  return (
    <div className="mb-8 rounded-lg border border-border bg-card/90 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-terracotta" aria-hidden="true" />
          <p className="font-serif text-2xl font-semibold">Admin Platform</p>
        </div>
        <Badge>{role}</Badge>
      </div>
      <nav className="flex flex-wrap gap-3 text-sm font-semibold text-muted-foreground">
        {adminRoutes.map((route) => (
          <Link key={route.href} href={route.href} className="rounded-md border border-border bg-background/70 px-3 py-2 hover:text-primary">
            {route.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
