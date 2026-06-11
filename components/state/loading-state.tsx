import { Card } from "@/components/ui/card";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <section className="container py-14 md:py-20" aria-busy="true" aria-live="polite">
      <Card className="bg-card/90 p-6">
        <div className="h-3 w-28 rounded-full bg-muted" />
        <div className="mt-5 h-10 w-full max-w-xl rounded-md bg-muted" />
        <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-muted" />
        <p className="sr-only">{label}</p>
      </Card>
    </section>
  );
}
