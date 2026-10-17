"use client";

import {
  DownloadIcon,
  ImageIcon,
  InboxIcon,
  LogOutIcon,
  MessageSquareWarningIcon,
  RefreshCwIcon,
  SearchIcon,
  ShirtIcon,
  SmileIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { logout } from "@/app/responses/actions";
import { fullDate, initials, ResponseDetail, TypeBadge } from "@/components/admin/response-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FeedbackResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_TILES = [
  { type: "", label: "All responses", icon: InboxIcon },
  { type: "Share your Experience", label: "Experiences", icon: SmileIcon },
  { type: "Product Enquiry", label: "Product enquiries", icon: ShirtIcon },
  { type: "Concern about Services", label: "Service concerns", icon: MessageSquareWarningIcon },
] as const;

const RANGES = { all: "All time", "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" } as const;
type Range = keyof typeof RANGES;

const DAY = 24 * 60 * 60 * 1000;
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diff)) return "";
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return relative.format(mins, "minute");
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return relative.format(days, "day");
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function toCsv(rows: FeedbackResponse[]) {
  const header = ["Timestamp", "Name", "Contact", "Campus", "Location", "Type", "Products", "Concern Area", "Feedback", "Photos"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      fullDate.format(new Date(r.timestamp)),
      r.name,
      r.contact,
      r.campus,
      r.location,
      r.shareType,
      r.products.join(", "),
      r.concernArea,
      r.feedback,
      String(r.images.length),
    ]
      .map((v) => escape(String(v ?? "")))
      .join(","),
  );
  return [header.map(escape).join(","), ...lines].join("\r\n");
}

function downloadCsv(rows: FeedbackResponse[]) {
  // BOM so Excel opens it as UTF-8.
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `feedback-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function Dashboard({
  responses,
  loadedAt,
}: {
  responses: FeedbackResponse[];
  // When `responses` were read; date ranges count back from here.
  loadedAt: number;
}) {
  const router = useRouter();
  const [loading, startRefresh] = useTransition();
  const [type, setType] = useState("");
  const [campus, setCampus] = useState("all");
  const [range, setRange] = useState<Range>("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const keyOf = (r: FeedbackResponse) => String(r.id);

  // Everything except the type filter: the tiles count within this.
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const since = range === "all" ? 0 : loadedAt - Number(range) * DAY;
    return responses.filter((r) => {
      if (campus !== "all" && r.campus !== campus) return false;
      if (since && new Date(r.timestamp).getTime() < since) return false;
      if (q && ![r.name, r.contact, r.location, ...r.products, r.concernArea, r.feedback].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [responses, loadedAt, campus, range, query]);

  const shown = useMemo(() => (type ? scoped.filter((r) => r.shareType === type) : scoped), [scoped, type]);
  const selected = shown.find((r) => keyOf(r) === selectedKey) ?? shown[0] ?? null;

  function select(r: FeedbackResponse) {
    setSelectedKey(keyOf(r));
    // Below lg the detail opens as a sheet instead of the side panel.
    if (!window.matchMedia("(min-width: 1024px)").matches) setSheetOpen(true);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Image src="/logo.png" alt="Kotu" width={32} height={32} className="size-8 rounded-full" />
          <p className="min-w-0 flex-1 truncate font-heading font-semibold">Feedback Responses</p>
          <Button variant="outline" className="h-9" onClick={() => downloadCsv(shown)} disabled={!shown.length}>
            <DownloadIcon /> <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="size-9" onClick={() => startRefresh(() => router.refresh())} disabled={loading} aria-label="Refresh">
                <RefreshCwIcon className={cn(loading && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9" onClick={() => logout()} aria-label="Sign out">
                <LogOutIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-6 sm:px-6">
        {/* Type tiles double as the type filter */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label="Filter by type">
          {TYPE_TILES.map(({ type: t, label, icon: Icon }) => {
            const count = t ? scoped.filter((r) => r.shareType === t).length : scoped.length;
            const active = type === t;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => setType(t)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-[#B9B7CC] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  active && "border-primary bg-accent shadow-[inset_0_0_0_1px_var(--primary)] hover:border-primary",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary",
                    active && "bg-primary text-primary-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className={cn("block font-heading text-2xl leading-tight font-semibold tabular-nums", active && "text-primary")}>
                    {count}
                  </span>
                  <span className="block text-xs leading-snug text-muted-foreground sm:text-sm">{label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name, phone, product, feedback…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 bg-card pl-9"
              aria-label="Search responses"
            />
          </div>
          <div className="flex gap-3">
            <ToggleGroup
              type="single"
              value={campus}
              onValueChange={(v) => v && setCampus(v)}
              className="h-10 rounded-lg border bg-card p-1"
              aria-label="Filter by campus"
            >
              {["all", "SNS", "TKH"].map((c) => (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  className="h-full rounded-md px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {c === "all" ? "All" : c}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="h-10! w-full bg-card sm:w-40" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RANGES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List + detail */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <section aria-label="Responses" className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3 text-sm">
              <span className="font-medium">{`${shown.length} response${shown.length === 1 ? "" : "s"}`}</span>
              <span className="text-xs text-muted-foreground">Newest first</span>
            </div>
            <ul className="max-h-[calc(100dvh-22rem)] min-h-64 divide-y overflow-y-auto lg:max-h-[calc(100dvh-20rem)]">
              {!shown.length && (
                <li className="flex flex-col items-center gap-2 px-6 py-16 text-center text-muted-foreground">
                  <InboxIcon className="size-8 opacity-40" />
                  <p className="font-medium text-foreground">{responses.length ? "No matching responses" : "No responses yet"}</p>
                  <p className="text-sm">{responses.length ? "Try a different search or filter." : "New feedback will show up here."}</p>
                </li>
              )}
              {shown.map((r) => {
                const isSelected = selected && keyOf(r) === keyOf(selected);
                return (
                  <li key={keyOf(r)}>
                    <button
                      type="button"
                      onClick={() => select(r)}
                      aria-current={isSelected || undefined}
                      className={cn(
                        "relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFE] focus-visible:bg-accent focus-visible:outline-none",
                        isSelected && "lg:bg-accent lg:before:absolute lg:before:inset-y-0 lg:before:left-0 lg:before:w-0.75 lg:before:bg-primary",
                      )}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted font-heading text-sm font-semibold text-primary">
                        {initials(r.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium">{r.name || "Anonymous"}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.timestamp)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{r.feedback || r.products.join(", ") || "—"}</span>
                        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <TypeBadge type={r.shareType} />
                          <span>{r.location || r.campus}</span>
                          {r.images.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <ImageIcon className="size-3.5" /> {r.images.length}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Response details" className="hidden rounded-2xl border bg-card p-6 lg:block">
            {selected ? (
              <ResponseDetail key={keyOf(selected)} response={selected} />
            ) : (
              <div className="grid h-full min-h-64 place-items-center text-sm text-muted-foreground">
                Select a response to see the details.
              </div>
            )}
          </section>
        </div>
      </main>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
          <SheetHeader className="sr-only">
            <SheetTitle>Response details</SheetTitle>
            <SheetDescription>Full response</SheetDescription>
          </SheetHeader>
          <div className="px-5 pt-12 pb-8">{selected && <ResponseDetail key={keyOf(selected)} response={selected} />}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
