import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type PopoverProps = {
  /** Controlled open state; omit for uncontrolled */
  open?: boolean;
  /** Called when open state should change */
  onOpenChange?: (next: boolean) => void;
  /** Default state for uncontrolled mode */
  defaultOpen?: boolean;
  /** Where to align relative to trigger */
  align?: "start" | "center" | "end";
  /** Side to place the popover */
  side?: "top" | "right" | "bottom" | "left";
  /** Offset in pixels */
  sideOffset?: number;
  /** Class for the content panel */
  contentClassName?: string;
  /** Overlay class (mobile / modal feel) */
  overlayClassName?: string;
  /** Rendered trigger element (button, icon, etc.) */
  trigger: React.ReactNode;
  /** The content; can be any rich React nodes (cards, forms, etc.) */
  children: React.ReactNode;
  /** Whether to close on outside click */
  closeOnOutsideClick?: boolean;
  /** Whether to close on Escape key */
  closeOnEsc?: boolean;
  /** Mount container for the portal */
  container?: Element | null;
  /** Whether to wrap trigger in a button (default: true). Set to false to use a div wrapper. */
  wrapInButton?: boolean;
  /** Custom className for the trigger wrapper */
  triggerClassName?: string;
};

/**
 * Popover — a rich dropdown that can host arbitrary content (forms, cards, divs).
 * - Accessible: focus management + Escape/outside click to dismiss.
 * - Layout options: side, align, offset.
 */
export function Popover({
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  align = "start",
  side = "bottom",
  sideOffset = 8,
  contentClassName,
  overlayClassName,
  trigger,
  children,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  container,
  wrapInButton = true,
  triggerClassName,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? !!openProp : uncontrolledOpen;
  const setOpen = (v: boolean) => (isControlled ? onOpenChange?.(v) : setUncontrolledOpen(v));

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Close on Escape
  React.useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc]);

  // Outside click
  React.useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (contentRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, closeOnOutsideClick]);

  // Simple positioning using the trigger rect
  const [styles, setStyles] = React.useState<React.CSSProperties>({});
  const position = React.useCallback(() => {
    const btn = triggerRef.current;
    const panel = contentRef.current;
    if (!btn || !panel) return;
    const r = btn.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = 0, left = 0;
    if (side === "bottom") top = r.bottom + sideOffset + scrollY;
    if (side === "top") top = r.top - panel.offsetHeight - sideOffset + scrollY;
    if (side === "right") top = r.top + scrollY;
    if (side === "left") top = r.top + scrollY;

    if (side === "bottom" || side === "top") {
      if (align === "start") left = r.left + scrollX;
      if (align === "center") left = r.left + r.width / 2 - panel.offsetWidth / 2 + scrollX;
      if (align === "end") left = r.right - panel.offsetWidth + scrollX;
    } else {
      // left/right sides
      if (align === "start") left = side === "right" ? r.right + sideOffset + scrollX : r.left - panel.offsetWidth - sideOffset + scrollX;
      if (align === "center") left = side === "right" ? r.right + sideOffset + scrollX : r.left - panel.offsetWidth - sideOffset + scrollX;
      if (align === "end") left = side === "right" ? r.right + sideOffset + scrollX : r.left - panel.offsetWidth - sideOffset + scrollX;
      // vertically center for left/right
      top = r.top + r.height / 2 - panel.offsetHeight / 2 + scrollY;
    }

    setStyles({ position: "absolute", top, left });
  }, [align, side, sideOffset]);

  React.useEffect(() => {
    if (!open) return;
    position();
    const onResize = () => position();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, position]);

  const triggerProps = {
    ref: triggerRef as any,
    "data-slot": "popover-trigger",
    "aria-haspopup": "dialog" as const,
    "aria-expanded": open,
    onClick: () => setOpen(!open),
    className: triggerClassName || (wrapInButton 
      ? "inline-flex h-9 items-center gap-2 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50"
      : "cursor-pointer"),
    role: wrapInButton ? undefined : "button",
    tabIndex: wrapInButton ? undefined : 0,
  };

  if (!mounted) {
    if (wrapInButton) {
      return (
        <button
          {...triggerProps}
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          type="button"
        >
          {trigger}
        </button>
      );
    } else {
      return (
        <div {...triggerProps} ref={triggerRef as React.RefObject<HTMLDivElement>}>
          {trigger}
        </div>
      );
    }
  }

  const content = open ? (
    <div data-slot="popover-root">
      {/* Optional page overlay for emphasis (esp. mobile) */}
      <div
        data-slot="overlay"
        className={cn(
          "fixed inset-0 z-[70] bg-transparent md:bg-transparent",
          overlayClassName
        )}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="false"
        ref={contentRef}
        data-slot="popover-content"
        style={styles}
        className={cn(
          "z-[71] min-w-80 rounded-lg border bg-background p-0 shadow-xl outline-none",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  ) : null;

  const TriggerWrapper = wrapInButton ? 'button' : 'div';
  const triggerWrapperProps = wrapInButton 
    ? { type: 'button' as const }
    : { role: 'button' as const, tabIndex: 0 };

  return (
    <>
      <TriggerWrapper
        ref={triggerRef as any}
        {...triggerWrapperProps}
        data-slot="popover-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={triggerClassName || (wrapInButton 
          ? "inline-flex h-9 items-center gap-2 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50"
          : "cursor-pointer")}
        onClick={() => setOpen(!open)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (!wrapInButton && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        {trigger}
      </TriggerWrapper>
      {createPortal(content as React.ReactNode, (container ?? document.body) as Element)}
    </>
  );
}

