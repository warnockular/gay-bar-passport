"use client";

import { ShieldCheck } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestVenueOwnership, type VenueClaimResult } from "@/features/venues/actions";

type VenueClaimFormProps = {
  venueId: string;
  venueSlug: string;
};

function fieldError(result: VenueClaimResult | null, name: keyof NonNullable<VenueClaimResult["fieldErrors"]>) {
  return result?.fieldErrors?.[name]?.[0];
}

export function VenueClaimForm({ venueId, venueSlug }: VenueClaimFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<VenueClaimResult | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const actionResult = await requestVenueOwnership(venueId, venueSlug, formData);
      setResult(actionResult);
      if (actionResult.ok) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={submit} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="claimantName">Your name</Label>
          <Input id="claimantName" name="claimantName" aria-invalid={Boolean(fieldError(result, "claimantName"))} />
          {fieldError(result, "claimantName") ? <p className="text-sm text-destructive">{fieldError(result, "claimantName")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="claimantEmail">Business email</Label>
          <Input id="claimantEmail" name="claimantEmail" type="email" aria-invalid={Boolean(fieldError(result, "claimantEmail"))} />
          {fieldError(result, "claimantEmail") ? <p className="text-sm text-destructive">{fieldError(result, "claimantEmail")}</p> : null}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roleTitle">Your role</Label>
          <Input id="roleTitle" name="roleTitle" placeholder="Owner, manager, programming director..." aria-invalid={Boolean(fieldError(result, "roleTitle"))} />
          {fieldError(result, "roleTitle") ? <p className="text-sm text-destructive">{fieldError(result, "roleTitle")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="evidenceUrl">Proof URL optional</Label>
          <Input id="evidenceUrl" name="evidenceUrl" type="url" placeholder="https://..." aria-invalid={Boolean(fieldError(result, "evidenceUrl"))} />
          {fieldError(result, "evidenceUrl") ? <p className="text-sm text-destructive">{fieldError(result, "evidenceUrl")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Why should this claim be approved?</Label>
        <Textarea id="notes" name="notes" aria-invalid={Boolean(fieldError(result, "notes"))} />
        {fieldError(result, "notes") ? <p className="text-sm text-destructive">{fieldError(result, "notes")}</p> : null}
      </div>
      {result ? <p className={result.ok ? "text-sm font-semibold text-sage" : "text-sm text-destructive"} role="status">{result.message}</p> : null}
      <Button type="submit" disabled={isPending}>
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Submitting..." : "Request ownership review"}
      </Button>
    </form>
  );
}
