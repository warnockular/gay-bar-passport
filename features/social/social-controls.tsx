import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addJournalComment, markNotificationsRead, toggleFollow, toggleJournalLike } from "@/features/social/actions";
import type { SocialJournalEntry } from "@/services/social";

export function FollowButton({ isFollowing, profileId }: { isFollowing: boolean; profileId: string }) {
  const action = toggleFollow.bind(null, profileId);

  return (
    <form action={action}>
      <Button type="submit" variant={isFollowing ? "outline" : "default"}>
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </form>
  );
}

export function LikeButton({ entry }: { entry: SocialJournalEntry }) {
  const action = toggleJournalLike.bind(null, entry.id);

  return (
    <form action={action}>
      <Button type="submit" variant={entry.likedByViewer ? "default" : "outline"} size="sm">
        <Heart className="h-4 w-4" aria-hidden="true" />
        {entry.likeCount}
      </Button>
    </form>
  );
}

export function CommentForm({ entryId }: { entryId: string }) {
  const action = addJournalComment.bind(null, entryId);

  return (
    <form action={action} className="space-y-3">
      <Textarea name="body" placeholder="Add a thoughtful note..." required maxLength={1000} />
      <Button type="submit" size="sm">
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Comment
      </Button>
    </form>
  );
}

export function MarkNotificationsReadButton() {
  return (
    <form action={markNotificationsRead}>
      <Button type="submit" variant="outline">
        <Bell className="h-4 w-4" aria-hidden="true" />
        Mark all read
      </Button>
    </form>
  );
}
