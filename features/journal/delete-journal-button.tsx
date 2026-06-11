"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteJournalEntry } from "@/features/journal/actions";

type DeleteJournalButtonProps = {
  entryId: string;
};

export function DeleteJournalButton({ entryId }: DeleteJournalButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm("Delete this journal entry?")) return;
          startTransition(async () => {
            const result = await deleteJournalEntry(entryId);
            setMessage(result.message);
          });
        }}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete
      </Button>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
