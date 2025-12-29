import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

export type DialogProps = {
  /** Controlled open state */
  open: boolean
  /** Called when open state should change */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title?: string
  /** Dialog description/content */
  description?: string
  /** Custom content (overrides description) */
  children?: React.ReactNode
  /** Class for the dialog panel */
  className?: string
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Mount container for the portal */
  container?: Element | null
}

/**
 * Dialog — a modal dialog component for confirmations and alerts
 * - Accessible: focus management + Escape/outside click to dismiss
 * - Centered with backdrop overlay
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showCloseButton = true,
  container,
}: DialogProps) {
  const [mounted, setMounted] = React.useState(false)
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => setMounted(true), [])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  // Focus management
  React.useEffect(() => {
    if (!open || !contentRef.current) return
    const focusableElements = contentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    firstElement?.focus()
  }, [open])

  // Outside click
  React.useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (contentRef.current?.contains(t)) return
      onOpenChange(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open, onOpenChange])

  if (!mounted || !open) return null

  const dialogContent = (
    <div
      data-slot="dialog-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        aria-describedby={description ? "dialog-description" : undefined}
        data-slot="dialog-content"
        className={cn(
          "relative z-[101] w-full max-w-md rounded-lg border bg-white dark:bg-slate-800 shadow-xl outline-none",
          "dark:border-slate-700",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
        
        <div className="p-6">
          {title && (
            <h2 id="dialog-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 pr-8">
              {title}
            </h2>
          )}
          {description && (
            <p id="dialog-description" className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(dialogContent, (container ?? document.body) as Element)
}

/**
 * ConfirmationDialog — a specialized dialog for confirmations
 */
export type ConfirmationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      showCloseButton={true}
    >
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" onClick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "destructive" ? "default" : "default"}
          onClick={handleConfirm}
          className={variant === "destructive" ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white" : ""}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}

