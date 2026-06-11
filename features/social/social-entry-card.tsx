import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LikeButton } from "@/features/social/social-controls";
import type { SocialJournalEntry } from "@/services/social";

export function SocialEntryCard({ entry }: { entry: SocialJournalEntry }) {
  return (
    <Card className="bg-card/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{entry.city ?? "Journal"}</Badge>
          {entry.venue ? <Badge className="normal-case tracking-normal">{entry.venue.name}</Badge> : null}
        </div>
        <LikeButton entry={entry} />
      </div>
      <Link href={`/journal/${entry.id}`}>
        <h2 className="mt-4 font-serif text-3xl font-semibold hover:text-primary">{entry.title}</h2>
      </Link>
      <p className="mt-2 text-sm text-muted-foreground">
        <CalendarDays className="mr-1 inline h-4 w-4" aria-hidden="true" />
        {entry.entry_date} · {entry.city}, {entry.country}
      </p>
      <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{entry.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Link className="font-semibold text-primary hover:underline" href={`/users/${entry.user_id}`}>
          {entry.author?.display_name ?? "Passport traveler"}
        </Link>
        <span>{entry.commentCount} comments</span>
      </div>
    </Card>
  );
}
