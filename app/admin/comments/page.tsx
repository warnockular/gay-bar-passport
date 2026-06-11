import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createModerationFlag, deleteComment, updateCommentModeration } from "@/features/admin/actions";
import { listAdminComments } from "@/services/admin";

export default async function AdminCommentsPage() {
  const comments = await listAdminComments();

  return (
    <div>
      <Badge>Comments</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Comment moderation.</h1>
      <div className="mt-8 space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-sm text-muted-foreground">{comment.profiles?.display_name ?? "Traveler"} on {comment.journal_entries?.title ?? "journal entry"}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6">{comment.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{comment.moderation_status}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["active", "hidden", "flagged"] as const).map((status) => (
                  <form key={status} action={updateCommentModeration.bind(null, comment.id, status)}>
                    <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">{status}</button>
                  </form>
                ))}
                <form action={createModerationFlag.bind(null, "comment", comment.id, "Comment flagged for review")}>
                  <button className="rounded-md border border-terracotta/50 bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Flag</button>
                </form>
                <form action={deleteComment.bind(null, comment.id)}>
                  <button className="rounded-md border border-destructive/40 bg-background/70 px-3 py-2 text-sm font-semibold text-destructive hover:bg-muted" type="submit">Delete</button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
