import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  copy: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, copy, align = "left" }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <Badge>{eyebrow}</Badge>
      <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-5xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{copy}</p>
    </div>
  );
}
