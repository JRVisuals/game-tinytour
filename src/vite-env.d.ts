/// <reference types="vite/client" />

declare module '*.json' {
  import type { TravelEventType } from './game/types'
  const value: {
    events: {
      id: string
      eventType: TravelEventType
      title: string
      body: string
      weight: number
      choices?: { id: string; label: string }[]
    }[]
  }
  export default value
}
