import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAdminNotifications } from "@/services/admin";

export default async function AdminNotificationsPage() {
  const notifications = await listAdminNotifications();

  return (
    <div>
      <Badge>Notifications</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Admin notification center.</h1>
      <div className="mt-8 space-y-4">
        {notifications.length ? notifications.map((notification) => (
          <Card key={notification.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{notification.type}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Recipient: {notification.user_id}</p>
                <p className="mt-1 text-sm text-muted-foreground">Actor: {notification.actor_id ?? "System"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{notification.read_at ? "read" : "unread"}</Badge>
                <Badge>{new Date(notification.created_at).toLocaleString()}</Badge>
              </div>
            </div>
          </Card>
        )) : <Card className="bg-card/90 p-6">No notifications yet.</Card>}
      </div>
    </div>
  );
}
