import { useState } from 'react'
import { Sidebar } from "@/components/ui/sidebar"
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'
import { ToastContainer } from '@/components/ToastContainer'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, FileText } from 'lucide-react'
import { SidebarNavigation } from './SidebarNavigation'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background/80 backdrop-blur-md fixed inset-y-0 z-30">
        <div className="p-4 border-b flex items-center gap-2 h-16">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold">AAA Resume</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <SidebarNavigation />
        </div>
        {user && (
          <div className="p-4 border-t bg-background/50">
            <p className="text-xs text-muted-foreground truncate font-medium">
              Signed in as
            </p>
            <p className="text-sm truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <Sidebar
        open={sideBarOpen}
        onOpenChange={setSideBarOpen}
        side="left"
        title="Menu"
        size="sm"
      >
        {(close) => (
          <div className="flex flex-col h-full">
            <div className="mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold">AAA Resume</span>
            </div>
            <SidebarNavigation onLinkClick={close} />
          </div>
        )}
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur-md h-16 flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSideBarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Mobile Brand */}
            <div className="md:hidden font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-lg">AAA Resume</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            )}
            {/* Mobile Sign Out (Icon Only) */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="md:hidden"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign Out</span>
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
