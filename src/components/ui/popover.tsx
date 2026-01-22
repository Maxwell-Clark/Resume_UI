import * as React from "react";
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
  /** Mount container for the portal (unused in this implementation) */
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
 * - Uses CSS-based positioning relative to trigger (no portals).
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
  wrapInButton = true,
  triggerClassName,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? !!openProp : uncontrolledOpen;
  const setOpen = React.useCallback((v: boolean) => {
    if (isControlled) {
      onOpenChange?.(v);
    } else {
      setUncontrolledOpen(v);
    }
  }, [isControlled, onOpenChange]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Close on Escape
  React.useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, setOpen]);

  // Outside click
  React.useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, closeOnOutsideClick, setOpen]);

  // Calculate CSS positioning classes based on side and align
  const getPositionStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      position: 'absolute',
      zIndex: 71,
    };

    // Side positioning
    if (side === 'bottom') {
      styles.top = `calc(100% + ${sideOffset}px)`;
    } else if (side === 'top') {
      styles.bottom = `calc(100% + ${sideOffset}px)`;
    } else if (side === 'right') {
      styles.left = `calc(100% + ${sideOffset}px)`;
      styles.top = 0;
    } else if (side === 'left') {
      styles.right = `calc(100% + ${sideOffset}px)`;
      styles.top = 0;
    }

    // Align positioning (for top/bottom sides)
    if (side === 'bottom' || side === 'top') {
      if (align === 'start') {
        styles.left = 0;
      } else if (align === 'center') {
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
      } else if (align === 'end') {
        styles.right = 0;
      }
    }

    // Align positioning (for left/right sides)
    if (side === 'left' || side === 'right') {
      if (align === 'start') {
        styles.top = 0;
      } else if (align === 'center') {
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
      } else if (align === 'end') {
        styles.bottom = 0;
        styles.top = 'auto';
      }
    }

    return styles;
  };

  const TriggerWrapper = wrapInButton ? 'button' : 'div';
  const triggerWrapperProps = wrapInButton
    ? { type: 'button' as const }
    : { role: 'button' as const, tabIndex: 0 };

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      data-slot="popover-container"
    >
      <TriggerWrapper
        {...triggerWrapperProps}
        data-slot="popover-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          triggerClassName || (wrapInButton
            ? "inline-flex h-9 items-center gap-2 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50"
            : "cursor-pointer"),
          open && "relative z-[72]"
        )}
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

      {open && (
        <>
          {/* Overlay to catch outside clicks */}
          <div
            data-slot="overlay"
            className={cn(
              "fixed inset-0 z-[70] bg-transparent",
              overlayClassName
            )}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="false"
            ref={contentRef}
            data-slot="popover-content"
            style={getPositionStyles()}
            className={cn(
              "min-w-0 rounded-lg border bg-background p-0 shadow-xl outline-none",
              contentClassName
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}
