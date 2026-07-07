import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/shared/button";
import { cn } from "@/lib/cn";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  total: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function PageSizeDropdown({
  value,
  onChange,
}: {
  value: number;
  onChange: (pageSize: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (nextValue: number) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative z-20 h-full shrink-0">
      <button
        type="button"
        className={cn(
          "flex h-full min-w-12 items-center justify-between gap-1.5 rounded-e-full bg-background px-2 text-[11px] font-extrabold text-foreground outline-none transition hover:bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/15 sm:min-w-16 sm:text-xs",
          isOpen && "bg-background ring-2 ring-primary/15",
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown
          size={14}
          className={cn("text-foreground/55 transition", isOpen && "rotate-180 text-primary")}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className="absolute bottom-[calc(100%+0.5rem)] end-0 z-[80] w-28 overflow-hidden rounded-xl border border-border/75 bg-card/95 p-1.5 shadow-lift backdrop-blur-xl"
        >
          {PAGE_SIZE_OPTIONS.map((option) => {
            const isSelected = option === value;

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-muted/75",
                  isSelected && "bg-primary/10 text-primary",
                )}
                onClick={() => handleSelect(option)}
              >
                <span>{option}</span>
                <span className="flex h-5 w-5 items-center justify-center">
                  {isSelected ? <Check size={15} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function PaginationControls({
  page,
  pageSize,
  total,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!total) {
    return null;
  }

  return (
    <div className="relative mt-4 flex max-w-full flex-wrap items-center justify-between gap-2 overflow-visible border-t border-border/40 pt-4 text-xs text-foreground/70">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-muted px-2 text-[11px] sm:px-3 sm:text-xs">
          {t("common.results")}: {total}
        </span>
        <span className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-muted px-2 text-[11px] sm:px-3 sm:text-xs">
          {t("common.page")} {page} {t("common.of")} {totalPages}
        </span>
        <div className="inline-flex h-8 shrink-0 items-center overflow-visible rounded-full border border-border/70 bg-background shadow-sm">
          <span className="flex h-full items-center whitespace-nowrap border-e border-border/60 px-2 text-[11px] text-foreground/70 sm:px-3 sm:text-xs">
            {t("common.perPage")}
          </span>
          <PageSizeDropdown value={pageSize} onChange={onPageSizeChange} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          className="h-8 whitespace-nowrap px-2.5 text-[11px] sm:px-3 sm:text-xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
        >
          {t("common.previous")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-8 whitespace-nowrap px-2.5 text-[11px] sm:px-3 sm:text-xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isFetching}
        >
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
