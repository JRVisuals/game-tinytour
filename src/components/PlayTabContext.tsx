import { createContext, useContext, type ReactNode } from 'react'
import type { PlayTabId } from './TourTabBar'

interface PlayTabContextValue {
  setPlayTab: (tab: PlayTabId) => void
}

const PlayTabContext = createContext<PlayTabContextValue | null>(null)

export function PlayTabProvider({
  children,
  setPlayTab,
}: {
  children: ReactNode
  setPlayTab: (tab: PlayTabId) => void
}) {
  return (
    <PlayTabContext.Provider value={{ setPlayTab }}>{children}</PlayTabContext.Provider>
  )
}

export function usePlayTab(): PlayTabContextValue {
  const ctx = useContext(PlayTabContext)
  if (!ctx) throw new Error('usePlayTab must be used within PlayTabProvider')
  return ctx
}
