import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GameProvider } from './game/GameContext'
import './index.css'

const theme = createTheme({
  primaryColor: 'teal',
  fontFamily: 'IBM Plex Sans, Helvetica Neue, Arial, sans-serif',
  headings: {
    fontFamily: 'IBM Plex Serif, Georgia, serif',
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <GameProvider>
        <App />
      </GameProvider>
    </MantineProvider>
  </StrictMode>,
)
