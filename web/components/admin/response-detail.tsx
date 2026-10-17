"use client";

import { CalendarIcon, CopyIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { toast } from "sonner";
import { ResponseImages } from "@/components/admin/response-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FeedbackResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  "Share your Experience": { label: "Experience", className: "bg-accent text-primary" },
  "Product Enquiry": { label: "Product enquiry", className: "bg-[#E8F2FC] text-[#0062BD]" },
  "Concern about Services": { label: "Service concern", className: "bg-[#FDF1F0] text-[#B7403B]" },
};

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  const style = TYPE_STYLES[type];
  if (!type) return null;
  return (
    <Badge variant="secondary" className={cn("rounded-full border-0 font-medium", style?.className, className)}>
      {style?.label ?? type}
    </Badge>
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export const fullDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium wrap-break-word">{children}</dd>
    </div>
  );
}

export function ResponseDetail({ response: r }: { response: FeedbackResponse }) {
  const date = new Date(r.timestamp);
  const phone = r.contact.replace(/[^\d+]/g, "");
  const products = r.products;

  return (
    <article className="space-y-6">
      <header className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary font-heading text-base font-semibold text-primary-foreground">
          {initials(r.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-semibold wrap-break-word">{r.name || "Anonymous"}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <TypeBadge type={r.shareType} />
            {!Number.isNaN(date.getTime()) && (
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="size-3.5" /> {fullDate.format(date)}
              </span>
            )}
          </div>
        </div>
      </header>

      {r.contact && (
        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-9 rounded-lg">
            <a href={`tel:${phone}`}>
              <PhoneIcon /> Call {r.contact}
            </a>
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-lg"
            onClick={() => navigator.clipboard.writeText(r.contact).then(() => toast.success("Phone number copied"))}
          >
            <CopyIcon /> Copy
          </Button>
        </div>
      )}

      <dl className="divide-y rounded-xl border px-4">
        <Row label="Campus">
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 text-muted-foreground" />
            {[r.campus, r.location].filter(Boolean).join(" · ") || "—"}
          </span>
        </Row>
        {products.length > 0 && (
          <Row label={products.length > 1 ? "Products" : "Product"}>
            <span className="flex flex-wrap gap-1.5">
              {products.map((p) => (
                <span key={p} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {p}
                </span>
              ))}
            </span>
          </Row>
        )}
        {r.concernArea && <Row label="Concern area">{r.concernArea}</Row>}
      </dl>

      {r.feedback && (
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Feedback</h3>
          <p className="rounded-xl bg-[#FAFAFE] p-4 leading-relaxed whitespace-pre-wrap wrap-break-word">{r.feedback}</p>
        </section>
      )}

      {r.images.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Photos <span className="tabular-nums">({r.images.length})</span>
          </h3>
          <ResponseImages images={r.images} />
        </section>
      )}
    </article>
  );
}
