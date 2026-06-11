import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CommentForm, LikeButton } from "@/features/social/social-controls";
import type { SocialJournalEntry } from "@/services/social";

export function JournalSocialPanel({ entry }: { entry: SocialJournalEntry }) {
  return (
    <Card className="mt-8 bg-card/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge>Community</Badge>
          <p className="mt-2 text-sm text-muted-foreground">{entry.commentCount} comment(s)</p>
        </div>
        <LikeButton entry={entry} />
      </div>
      <div className="mt-5 space-y-4">
        {entry.comments.length ? (
          entry.comments.map((comment) => (
            <div key={comment.id} className="rounded-md border border-border bg-background/70 p-4">
              <Link className="text-sm font-semibold text-primary hover:underline" href={`/users/${comment.user_id}`}>
                {comment.author?.display_name ?? "Passport traveler"}
              </Link>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{comment.body}</p>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            No comments yet.
          </div>
        )}
      </div>
      <div className="mt-5">
        <CommentForm entryId={entry.id} />
      </div>
    </Card>
  );
}
