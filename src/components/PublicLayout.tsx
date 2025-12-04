import { Navbar, NavbarBrand, NavbarNav, NavbarItem, NavbarLink, NavbarActions, NavbarSpacer, NavbarMenuButton } from "@/components/ui/navbar"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const navLinks = [
    { path: '/features', label: 'Features' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/faq', label: 'FAQ' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ]

  const handleGetStarted = () => {
    if (user) {
      navigate('/tailor')
    } else {
      navigate('/signup')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navbar>
        <NavbarMenuButton />
        <NavbarBrand>
          <Link to="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold">AAA Resume</span>
          </Link>
        </NavbarBrand>
        <NavbarNav>
          {navLinks.map((link) => (
            <NavbarItem key={link.path}>
              <Link 
                to={link.path}
                className={`rounded-md px-3 py-2 text-sm font-medium outline-none transition-[color,box-shadow] hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                  location.pathname === link.path
                    ? 'text-foreground font-semibold'
                    : 'text-foreground/80'
                }`}
              >
                {link.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarNav>
        <NavbarSpacer />
        <NavbarActions>
          <ThemeToggle />
          {user ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/tailor')}
              className="ml-2"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="ml-2">
                  Sign In
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={handleGetStarted}
                className="ml-2"
              >
                Get Started
              </Button>
            </>
          )}
        </NavbarActions>
      </Navbar>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

