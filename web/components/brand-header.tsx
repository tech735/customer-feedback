import Image from "next/image";
import { cn } from "@/lib/utils";

// Blue brand band at the top of every page. Page content overlaps its bottom
// edge (see the negative margin on the card below it).
export function BrandHeader({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("brand-gradient px-4 pt-8 pb-24 text-center text-white sm:pt-10 sm:pb-28", className)}>
      <Image
        src="/logo.png"
        alt="Kotu"
        width={64}
        height={64}
        priority
        className="mx-auto mb-4 size-14 rounded-full ring-4 ring-white/15 sm:size-16"
      />
      <h1 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h1>      {children}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="px-4 pt-8 pb-10 text-center text-sm text-muted-foreground">
      © Kotu ·{" "}
      <a href="https://www.kotu.co.in" target="_blank" rel="noopener" className="font-medium text-primary hover:underline">
        www.kotu.co.in
      </a>
    </footer>
  );
}
