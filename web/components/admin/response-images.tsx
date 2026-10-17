"use client";

import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ImageOffIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ResponseImage } from "@/lib/types";

// Shown when the browser can't display the file (e.g. HEIC photos from
// iPhones outside Safari); it can still be downloaded.
function CantPreview({ image, compact }: { image: ResponseImage; compact?: boolean }) {
  return (
    <a
      href={image.url}
      download={image.name}
      className={
        compact
          ? "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-1 text-center text-xs text-muted-foreground hover:border-primary hover:text-primary"
          : "flex flex-col items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      }
    >
      <ImageOffIcon className="size-4" />
      {compact ? "Download" : "This format can’t be previewed. Download it instead."}
    </a>
  );
}

function Thumb({ image, index, onOpen }: { image: ResponseImage; index: number; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <CantPreview image={image} compact />;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View image ${index + 1}`}
      className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked route */}
      <img
        src={image.url}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </button>
  );
}

function Viewer({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: ResponseImage[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const [failedId, setFailedId] = useState<string | null>(null);
  const image = index === null ? null : images[index];
  const many = images.length > 1;
  const go = (delta: number) => index !== null && onIndex((index + delta + images.length) % images.length);

  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[min(960px,calc(100vw-2rem))] gap-0 overflow-hidden p-0 sm:max-w-[min(960px,calc(100vw-2rem))]"
        onKeyDown={(e) => {
          if (!many) return;
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        <div className="flex items-center gap-3 border-b py-2.5 pr-12 pl-5">
          <DialogTitle className="text-sm font-medium">
            Image {index !== null ? index + 1 : ""} {many && <span className="text-muted-foreground">of {images.length}</span>}
          </DialogTitle>
          <DialogDescription className="sr-only">Uploaded with this response</DialogDescription>
          {image && (
            <Button asChild variant="link" size="sm" className="ml-auto h-auto px-0">
              <a href={image.url} download={image.name}>
                Download <DownloadIcon />
              </a>
            </Button>
          )}
        </div>
        <div className="relative grid min-h-72 place-items-center bg-[#FAFAFE] p-3">
          {image &&
            (failedId === image.id ? (
              <CantPreview image={image} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked route
              <img
                key={image.id}
                src={image.url}
                alt={`Image ${index! + 1}`}
                onError={() => setFailedId(image.id)}
                className="max-h-[calc(100dvh-10rem)] w-auto object-contain"
              />
            ))}
          {many && (
            <>
              <Button variant="secondary" size="icon-lg" className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full shadow" onClick={() => go(-1)} aria-label="Previous image">
                <ChevronLeftIcon />
              </Button>
              <Button variant="secondary" size="icon-lg" className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full shadow" onClick={() => go(1)} aria-label="Next image">
                <ChevronRightIcon />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ResponseImages({ images }: { images: ResponseImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,7.5rem))] gap-2">
        {images.map((img, i) => (
          <Thumb key={img.id} image={img} index={i} onOpen={() => setOpen(i)} />
        ))}
      </div>
      <Viewer images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}
