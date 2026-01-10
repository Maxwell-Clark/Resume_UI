import { Link, useLocation } from 'react-router-dom'
import { Sparkles, History, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarNavigationProps {
  onLinkClick?: () => void
}

export function SidebarNavigation({ onLinkClick }: SidebarNavigationProps) {
  const location = useLocation()

  const links = [
    { to: '/studio', label: 'Resume Studio', icon: Sparkles, isActive: (path: string) => path.startsWith('/studio') },
    { to: '/history', label: 'History', icon: History },
    { to: '/account', label: 'Account', icon: User },
  ]

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon
        const active = link.isActive ? link.isActive(location.pathname) : location.pathname === link.to
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

