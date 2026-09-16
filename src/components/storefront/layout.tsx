import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-3 text-xs uppercase tracking-widest text-shop-muted">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl text-shop-ink sm:text-4xl">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
