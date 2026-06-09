import { Stamp } from "lucide-react";
import { cn } from "@/lib/utils";

type PassportStampProps = {
  city: string;
  date: string;
  tone?: "sage" | "terracotta" | "rose";
};

const tones = {
  sage: "border-sage text-sage",
  terracotta: "border-terracotta text-terracotta",
  rose: "border-rose text-rose"
};

export function PassportStamp({ city, date, tone = "sage" }: PassportStampProps) {
  return (
    <div
      className={cn(
        "passport-border flex aspect-square w-full max-w-44 rotate-[-4deg] flex-col items-center justify-center rounded-lg border-2 bg-background/70 p-4 text-center shadow-sm",
        tones[tone]
      )}
    >
      <Stamp className="h-8 w-8" aria-hidden="true" />
      <p className="mt-3 font-serif text-2xl font-semibold leading-none">{city}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em]">{date}</p>
    </div>
  );
}
