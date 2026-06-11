import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateUserStatus } from "@/features/admin/actions";
import { listAdminUsers } from "@/services/admin";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();

  return (
    <div>
      <Badge>Users</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">User moderation.</h1>
      <div className="mt-8 space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link href={`/admin/users/${user.id}`} className="font-serif text-2xl font-semibold hover:text-primary">
                  {user.display_name ?? "Passport traveler"}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{user.id}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{user.role}</Badge>
                  <Badge>{user.status}</Badge>
                  {user.deleted_at ? <Badge>soft deleted</Badge> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={updateUserStatus.bind(null, user.id, user.status === "suspended" ? "active" : "suspended")}>
                  <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">
                    {user.status === "suspended" ? "Reinstate" : "Suspend"}
                  </button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
