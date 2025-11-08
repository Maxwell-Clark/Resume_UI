import { useState } from 'react'
import { NavbarPreset } from "@/components/ui/navbar"
import { Sidebar } from "@/components/ui/sidebar"
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <NavbarPreset
        brand={<span>AAA Resume</span>}
        onSidebarToggle={() => setSideBarOpen(true)}
        right={
          <>
            <NotificationBell />
            <ThemeToggle />
          </>
        }
      />
      <Sidebar
        open={sideBarOpen}
        onOpenChange={setSideBarOpen}
        side="left"
        title="Quick actions"
        size="md"
      >
        {(close) => (
          <div className="space-y-3">
            <Link
              to="/"
              className={`block rounded-md px-3 py-2 hover:bg-accent ${
                location.pathname === '/' ? 'bg-accent' : ''
              }`}
              onClick={close}
            >
              Tailor
            </Link>
            <Link
              to="/history"
              className={`block rounded-md px-3 py-2 hover:bg-accent ${
                location.pathname === '/history' ? 'bg-accent' : ''
              }`}
              onClick={close}
            >
              History
            </Link>
            <Link
              to="/account"
              className={`block rounded-md px-3 py-2 hover:bg-accent ${
                location.pathname === '/account' ? 'bg-accent' : ''
              }`}
              onClick={close}
            >
              Account
            </Link>
          </div>
        )}
      </Sidebar>
      {children}
    </div>
  )
}
