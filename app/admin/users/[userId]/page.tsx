import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { softDeleteUser, updateUserRole, updateUserStatus } from "@/features/admin/actions";
import { getAdminUser } from "@/services/admin";

type AdminUserPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserPage({ params }: AdminUserPageProps) {
  const { userId } = await params;
  const user = await getAdminUser(userId);
  if (!user) notFound();

  return (
    <div>
      <Badge>User</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">{user.display_name ?? "Passport traveler"}</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="bg-card/90 p-6">
          <h2 className="font-serif text-3xl font-semibold">Profile inspection</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p><span className="font-semibold">ID:</span> {user.id}</p>
            <p><span className="font-semibold">Home city:</span> {user.home_city ?? "Not set"}</p>
            <p><span className="font-semibold">Created:</span> {new Date(user.created_at).toLocaleString()}</p>
            <p><span className="font-semibold">Status:</span> {user.status}</p>
            <p><span className="font-semibold">Role:</span> {user.role}</p>
          </div>
        </Card>
        <Card className="bg-card/90 p-6">
          <h2 className="font-serif text-3xl font-semibold">Controls</h2>
          <form action={updateUserRole.bind(null, user.id)} className="mt-5 space-y-3">
            <select name="role" defaultValue={user.role} className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm">
              <option value="user">user</option>
              <option value="moderator">moderator</option>
              <option value="admin">admin</option>
            </select>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Assign role</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            <form action={updateUserStatus.bind(null, user.id, user.status === "suspended" ? "active" : "suspended")}>
              <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">
                {user.status === "suspended" ? "Reinstate" : "Suspend"}
              </button>
            </form>
            <form action={softDeleteUser.bind(null, user.id)}>
              <button className="rounded-md border border-destructive/40 bg-background/70 px-3 py-2 text-sm font-semibold text-destructive hover:bg-muted" type="submit">Soft delete</button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
