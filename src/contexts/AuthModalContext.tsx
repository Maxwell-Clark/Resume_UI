import { createContext, useContext, useState, type ReactNode } from 'react'

type AuthMode = 'login' | 'signup'

interface AuthModalContextType {
  isOpen: boolean
  mode: AuthMode
  openAuthModal: (mode?: AuthMode) => void
  closeAuthModal: () => void
  setMode: (mode: AuthMode) => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')

  const openAuthModal = (initialMode: AuthMode = 'login') => {
    setMode(initialMode)
    setIsOpen(true)
  }

  const closeAuthModal = () => {
    setIsOpen(false)
  }

  const value = {
    isOpen,
    mode,
    openAuthModal,
    closeAuthModal,
    setMode,
  }

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}
