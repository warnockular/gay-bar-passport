import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
};

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <Card className="bg-card/90 p-6">
      {icon ? <div className="text-terracotta">{icon}</div> : null}
      <h2 className="mt-4 font-serif text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
