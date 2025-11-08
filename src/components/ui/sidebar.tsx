import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type SidebarProps = {
  /** Controlled open state */
  open: boolean;
  /** Handler to update open state */
  onOpenChange: (next: boolean) => void;
  /** Which side the panel slides from */
  side?: "left" | "right";
  /** Optional title for a11y */
  title?: string;
  /** Width preset */
  size?: "sm" | "md" | "lg" | "xl" | number; // number interpreted as px
  /** Close when clicking the backdrop */
  closeOnBackdrop?: boolean;
  /** Close when pressing Escape */
  closeOnEsc?: boolean;
  /** Render children; gets a close function via render prop if desired */
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  /** Custom class for the sheet */
  className?: string;
  /** Custom class for the overlay */
  overlayClassName?: string;
  /** Mount node; defaults to document.body */
  container?: Element | null;
};

/**
 * Sidebar — a controlled, accessible sliding panel.
 * - Controlled via `open` boolean and `onOpenChange` callback.
 * - Focus returned to last active element on close.
 * - Body scroll locked while open.
 */
export function Sidebar({
  open,
  onOpenChange,
  side = "right",
  title,
  size = "md",
  closeOnBackdrop = true,
  closeOnEsc = true,
  children,
  className,
  overlayClassName,
  container,
}: SidebarProps) {
  const [mounted, setMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const lastActiveRef = React.useRef<HTMLElement | null>(null);

  // Track mount for portal safety (SSR/Next.js)
  React.useEffect(() => setMounted(true), []);

  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [open]);

  // Remember and restore focus
  React.useEffect(() => {
    if (open) {
      lastActiveRef.current = (document.activeElement as HTMLElement) ?? null;
      // After open, focus panel for a11y
      const id = window.setTimeout(() => panelRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    } else {
      // restore focus to previous trigger
      lastActiveRef.current?.focus?.();
    }
  }, [open]);

  // Escape key handling
  React.useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onOpenChange]);

  if (!mounted) return null;

  const widthClass =
    typeof size === "number"
      ? undefined
      : size === "sm"
      ? "w-64"
      : size === "md"
      ? "w-80"
      : size === "lg"
      ? "w-96"
      : "w-[32rem]"; // xl

  const inlineWidth = typeof size === "number" ? { width: `${size}px` } : undefined;

  const slideIn = side === "right" ? "translate-x-0" : "-translate-x-0"; // always zero when open
  const slideOut = side === "right" ? "translate-x-full" : "-translate-x-full";
  const position = side === "right" ? "right-0" : "left-0";

  const content = (
    <div data-slot="sidebar-root">
      {/* Overlay */}
      <div
        data-slot="overlay"
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
          overlayClassName
        )}
        onClick={() => closeOnBackdrop && onOpenChange(false)}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
        data-slot="sidebar"
        className={cn(
          "fixed top-0 z-[61] h-dvh border-l bg-background shadow-2xl outline-none transition-transform duration-300 will-change-transform md:shadow-xl",
          position,
          open ? slideIn : slideOut,
          widthClass,
          className
        )}
        style={inlineWidth}
      >
        <div className="flex h-full flex-col">
          {/* Drag/Accessible header region */}
          {title ? (
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-foreground/80 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onClick={() => onOpenChange(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : null}

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {typeof children === "function" ? children(() => onOpenChange(false)) : children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, (container ?? document.body) as Element);
}

// Convenience hook for a controlled pair (state + binder)
export function useSidebar(initial = false) {
  const [open, setOpen] = React.useState(initial);
  return { open, setOpen } as const;
}

// Example button that follows the same visual language as Navbar buttons
export type SidebarTriggerProps = React.ComponentProps<"button">;
export function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  );
}

