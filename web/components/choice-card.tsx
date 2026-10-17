"use client";

import { CheckIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// A large tappable option for single-choice questions, with a check badge
// when selected. Use inside <RadioGroup>.
export function ChoiceCard({
  value,
  title,
  description,
  icon,
  className,
}: {
  value: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      className={cn(
        "group/choice flex w-full items-center gap-3 rounded-xl border border-input bg-card p-4 text-left transition-all outline-none",
        "hover:border-[#B9B7CC] hover:bg-[#FAFAFE]",
        "focus-visible:ring-3 focus-visible:ring-ring/40",
        "data-[state=checked]:border-primary data-[state=checked]:bg-accent data-[state=checked]:shadow-[inset_0_0_0_1px_var(--primary)]",
        "aria-invalid:border-destructive",
        className,
      )}
    >
      {icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary transition-colors group-data-[state=checked]/choice:bg-primary group-data-[state=checked]/choice:text-primary-foreground [&_svg]:size-5">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground group-data-[state=checked]/choice:text-primary">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>}
      </span>
      <span
        aria-hidden
        className="grid size-5 shrink-0 place-items-center rounded-full border border-input text-primary-foreground transition-colors group-data-[state=checked]/choice:border-primary group-data-[state=checked]/choice:bg-primary"
      >
        <CheckIcon className="size-3.5 scale-0 transition-transform group-data-[state=checked]/choice:scale-100" strokeWidth={3} />
      </span>
    </RadioGroupPrimitive.Item>
  );
}
