import { useState } from 'react'
import { NavbarPreset } from "@/components/ui/navbar"
import { Sidebar } from "@/components/ui/sidebar"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false)
  const location = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <NavbarPreset
        brand={<span>AAA Resume</span>}
        onSidebarToggle={() => setSideBarOpen(true)}
        right={
          <>
            {user && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {user.email}
                </span>
              </div>
            )}
            <NotificationBell />
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
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
              to="/tailor"
              className={`block rounded-md px-3 py-2 hover:bg-accent ${
                location.pathname === '/tailor' ? 'bg-accent' : ''
              }`}
              onClick={close}
            >
              Tailor
            </Link>
            <Link
              to="/match"
              className={`block rounded-md px-3 py-2 hover:bg-accent ${
                location.pathname === '/match' ? 'bg-accent' : ''
              }`}
              onClick={close}
            >
              Match
            </Link>
            <Link
              to="/editor"
              className={`block rounded-md px-3 py-2 hover:bg-accent ${
                location.pathname.startsWith('/editor') ? 'bg-accent' : ''
              }`}
              onClick={close}
            >
              Editor
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
