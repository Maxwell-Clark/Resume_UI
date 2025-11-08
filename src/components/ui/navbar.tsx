import * as React from "react";
import { cn } from "@/lib/utils";

// Context to let subcomponents control mobile menu
type NavbarCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};
const NavbarContext = React.createContext<NavbarCtx | null>(null);

function useNavbar() {
  const ctx = React.useContext(NavbarContext);
  if (!ctx) throw new Error("Navbar.* must be used within <Navbar>");
  return ctx;
}

export type NavbarProps = React.ComponentProps<"header"> & {
  sticky?: boolean;
  containerClassName?: string;
};

/**
 * <Navbar> — accessible, responsive, shadcn-style API.
 * Usage mirrors the Textarea pattern (className passthrough + cn). All parts expose data-slot attrs.
 */
export function Navbar({
  className,
  containerClassName,
  sticky = true,
  children,
  ...props
}: NavbarProps) {
  const [open, setOpen] = React.useState(false);

  // Close on route change hash change (optional resilience)
  React.useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <NavbarContext.Provider value={{ open, setOpen }}>
      <header
        data-slot="navbar"
        className={cn(
          "z-50 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          sticky && "sticky top-0",
          className
        )}
        {...props}
      >
        <div
          data-slot="container"
          className={cn(
            "mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 md:h-16 md:px-4",
            containerClassName
          )}
        >
          {children}
        </div>
        {/* Mobile collapse */}
        <NavbarCollapse />
      </header>
    </NavbarContext.Provider>
  );
}

export type NavbarBrandProps = React.ComponentProps<"a">;
export function NavbarBrand({ className, ...props }: NavbarBrandProps) {
  return (
    <a
      data-slot="brand"
      className={cn(
        "inline-flex select-none items-center gap-2 rounded-md px-1 text-base font-semibold outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  );
}

export type NavbarMenuButtonProps = React.ComponentProps<"button">;
export function NavbarMenuButton({ className, "aria-label": ariaLabel, ...props }: NavbarMenuButtonProps) {
  const { open, setOpen } = useNavbar();
  return (
    <button
      type="button"
      data-slot="menu-button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border bg-transparent shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden",
        className
      )}
      aria-label={ariaLabel ?? "Toggle menu"}
      aria-expanded={open}
      aria-controls="navbar-collapse"
      onClick={() => setOpen(!open)}
      {...props}
    >
      {/* simple hamburger */}
      <span className="sr-only">Toggle menu</span>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export type NavbarSpacerProps = React.ComponentProps<"div">;
export function NavbarSpacer({ className, ...props }: NavbarSpacerProps) {
  return <div data-slot="spacer" className={cn("grow", className)} {...props} />;
}

export type NavbarNavProps = React.ComponentProps<"ul">;
export function NavbarNav({ className, ...props }: NavbarNavProps) {
  return (
    <ul
      data-slot="nav"
      className={cn(
        "hidden items-center gap-1 md:flex",
        className
      )}
      {...props}
    />
  );
}

export type NavbarItemProps = React.ComponentProps<"li">;
export function NavbarItem({ className, ...props }: NavbarItemProps) {
  return <li data-slot="item" className={cn("list-none", className)} {...props} />;
}

export type NavbarLinkProps = React.ComponentProps<"a"> & {
  active?: boolean;
};
export function NavbarLink({ className, active, ...props }: NavbarLinkProps) {
  return (
    <a
      data-slot="link"
      data-active={active ? "" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "data-[active]:text-foreground data-[active]:font-semibold",
        className
      )}
      {...props}
    />
  );
}

export type NavbarActionsProps = React.ComponentProps<"div">;
export function NavbarActions({ className, ...props }: NavbarActionsProps) {
  return (
    <div
      data-slot="actions"
      className={cn("ml-auto hidden items-center gap-2 md:flex", className)}
      {...props}
    />
  );
}

// NEW: Right-side "sandwich" button to control an external sidebar
export type NavbarSidebarButtonProps = React.ComponentProps<"button"> & {
  pressed?: boolean;
};
export function NavbarSidebarButton({ className, pressed, "aria-label": ariaLabel, ...props }: NavbarSidebarButtonProps) {
  return (
    <button
      type="button"
      data-slot="sidebar-button"
      aria-label={ariaLabel ?? "Open sidebar"}
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border bg-transparent shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
      {...props}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        {/* hamburger */}
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// Collapsible mobile panel automatically wired to Navbar state
export type NavbarCollapseProps = React.ComponentProps<"div">;
export function NavbarCollapse({ className, children, ...props }: NavbarCollapseProps) {
  const { open } = useNavbar();
  return (
    <div
      id="navbar-collapse"
      data-slot="collapse"
      data-open={open ? "" : undefined}
      className={cn(
        "md:hidden",
        open ? "block" : "hidden",
        className
      )}
      {...props}
    >
      {/* default layout for mobile items */}
      {children ?? (
        <nav className="space-y-1 border-t p-3">
          <a className="block rounded-md px-3 py-2 text-sm outline-none transition-[color,box-shadow] hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50" href="#">Home</a>
          <a className="block rounded-md px-3 py-2 text-sm outline-none transition-[color,box-shadow] hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50" href="#features">Features</a>
          <a className="block rounded-md px-3 py-2 text-sm outline-none transition-[color,box-shadow] hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50" href="#pricing">Pricing</a>
        </nav>
      )}
    </div>
  );
}

// Convenience preset that mirrors common usage
export function NavbarPreset({
  brand,
  links = [
  
  ],
  right,
  onSidebarToggle,
  showSidebarButton = true,
  className,
  ...props
}: {
  brand: React.ReactNode;
  links?: { href: string; label: string; active?: boolean }[];
  right?: React.ReactNode;
  onSidebarToggle?: () => void; // wire to your drawer/command menu
  showSidebarButton?: boolean;
} & NavbarProps) {
  return (
    <Navbar className={className} {...props}>
      {/* Left side: mobile menu */}
      <NavbarMenuButton />

      {/* Brand */}
      <NavbarBrand href="#">{brand}</NavbarBrand>

      {/* Center links */}
      <NavbarNav>
        {links.map((l) => (
          <NavbarItem key={l.href}>
            <NavbarLink href={l.href} active={l.active}>
              {l.label}
            </NavbarLink>
          </NavbarItem>
        ))}
      </NavbarNav>

      {/* Spacer pushes actions to right */}
      <NavbarSpacer />

      {/* Right actions */}
      <NavbarActions>
        {right}
        {showSidebarButton && (
          <NavbarSidebarButton aria-label="Open sidebar" onClick={onSidebarToggle} />
        )}
      </NavbarActions>
    </Navbar>
  );
}

// --- End of file ---

