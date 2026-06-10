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
      <div className="max-w-3xl">
        <Badge>{eyebrow}</Badge>
        <h1 className="mt-5 font-serif text-5xl font-semibold leading-tight md:text-6xl">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{copy}</p>
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}
