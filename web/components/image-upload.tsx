"use client";

import { ImagePlusIcon, XIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_IMAGE_BYTES, MAX_IMAGES } from "@/lib/form-options";
import { cn } from "@/lib/utils";

export function ImageUpload({
  label,
  files,
  onChange,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function add(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const tooBig = incoming.filter((f) => f.size > MAX_IMAGE_BYTES);
    if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(", ")} is larger than 5 MB.`);
    const next = [...files, ...incoming.filter((f) => f.size <= MAX_IMAGE_BYTES)];
    if (next.length > MAX_IMAGES) toast.error(`You can upload up to ${MAX_IMAGES} images.`);
    onChange(next.slice(0, MAX_IMAGES));
  }

  const full = files.length >= MAX_IMAGES;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label} <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {files.length}/{MAX_IMAGES}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={src} className="group relative size-20 overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img src={src} alt={files[i].name} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              aria-label={`Remove ${files[i].name}`}
              className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ))}

        {!full && (
          <label
            htmlFor={id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              add(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed border-[#C9C7DC] bg-[#FAFAFE] px-4 py-3 text-sm transition-colors hover:border-primary hover:bg-accent has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
              files.length ? "h-20" : "w-full py-5",
              dragging && "border-primary bg-accent",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-xs">
              <ImagePlusIcon className="size-5" />
            </span>
            <span className={cn(files.length && "sr-only sm:not-sr-only")}>
              <span className="block font-medium text-primary">{files.length ? "Add more" : "Add photos"}</span>
              <span className="block text-xs text-muted-foreground">PNG or JPG · up to 5 MB each</span>
            </span>
            <input
              ref={inputRef}
              id={id}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
