import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type PageShellProps = {
  eyebrow: string;
  title: string;
  copy: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, copy, children }: PageShellProps) {
  return (
    <section className="container py-14 md:py-20">
      <div className="max-w-3xl min-w-0">
        <Badge>{eyebrow}</Badge>
        <h1 className="mt-5 break-words font-serif text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{copy}</p>
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}
