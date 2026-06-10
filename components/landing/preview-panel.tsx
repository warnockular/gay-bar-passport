import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PreviewPanelProps = {
  icon: LucideIcon;
  title: string;
  copy: string;
  detail: string;
};

export function PreviewPanel({ icon: Icon, title, copy, detail }: PreviewPanelProps) {
  return (
    <Card className="bg-card/80">
      <CardHeader>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-sage/15 text-sage">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="font-serif text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
        <p className="mt-5 border-l-2 border-terracotta pl-4 text-sm font-semibold text-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
