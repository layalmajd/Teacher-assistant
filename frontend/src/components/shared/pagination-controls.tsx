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
    <div ref={rootRef} className="relative h-full">
      <button
        type="button"
        className={cn(
          "flex h-full min-w-24 items-center justify-between gap-2 rounded-e-full bg-background px-3 text-sm font-extrabold text-foreground outline-none transition hover:bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/15",
          isOpen && "bg-background ring-2 ring-primary/15",
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown
          size={16}
          className={cn("text-foreground/55 transition", isOpen && "rotate-180 text-primary")}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className="absolute bottom-full end-0 z-50 mb-2 w-28 overflow-hidden rounded-xl border border-border/75 bg-card/95 p-1.5 shadow-lift backdrop-blur-xl"
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
    <div className="mt-4 flex flex-col gap-3 border-t border-border/40 pt-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 text-sm text-foreground/70 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="inline-flex h-10 items-center rounded-full bg-muted px-4">
          {t("common.results")}: {total}
        </span>
        <span className="inline-flex h-10 items-center rounded-full bg-muted px-4">
          {t("common.page")} {page} {t("common.of")} {totalPages}
        </span>
        <div className="inline-flex h-10 items-center overflow-visible rounded-full border border-border/70 bg-background shadow-sm">
          <span className="flex h-full items-center border-e border-border/60 px-4 text-foreground/70">
            {t("common.perPage")}
          </span>
          <PageSizeDropdown value={pageSize} onChange={onPageSizeChange} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
        >
          {t("common.previous")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isFetching}
        >
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
