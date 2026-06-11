import Link from "next/link";
import { Bell } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/state/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarkNotificationsReadButton } from "@/features/social/social-controls";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/services/social";

function notificationCopy(type: string) {
  if (type === "new_follower") return "started following you";
  if (type === "new_like") return "liked your journal entry";
  return "commented on your journal entry";
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = user ? await listNotifications(user.id) : [];

  return (
    <PageShell eyebrow="Notifications" title="Community signals from your passport." copy="Follows, likes, and comments collect here as travelers interact with your public entries.">
      <div className="mb-6">
        <MarkNotificationsReadButton />
      </div>
      <div className="space-y-4">
        {notifications.length ? (
          notifications.map((notification) => (
            <Card key={notification.id} className="bg-card/90 p-5">
              <div className="flex flex-wrap items-center gap-2">
                {!notification.read_at ? <Badge>New</Badge> : null}
                <p className="text-sm text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-3 font-semibold">
                <Link className="text-primary hover:underline" href={notification.actor_id ? `/users/${notification.actor_id}` : "/users"}>
                  {notification.actor?.display_name ?? "A traveler"}
                </Link>{" "}
                {notificationCopy(notification.type)}.
              </p>
              {notification.entry ? (
                <Link className="mt-2 inline-block text-sm font-semibold text-primary hover:underline" href={`/journal/${notification.entry.id}`}>
                  {notification.entry.title}
                </Link>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState
            description="Public journal likes, comments, and new followers will appear here."
            icon={<Bell className="h-5 w-5" aria-hidden="true" />}
            title="No notifications yet."
          />
        )}
      </div>
    </PageShell>
  );
}
