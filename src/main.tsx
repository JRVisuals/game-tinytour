import { Button, MantineProvider, Paper, createTheme } from '@mantine/core'
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
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'transform 100ms ease, box-shadow 100ms ease, filter 100ms ease',
          '&:not([data-disabled]):hover': {
            transform: 'translateY(-1px)',
          },
          '&:not([data-disabled]):active': {
            transform: 'translateY(0)',
          },
        },
      },
    }),
    Paper: Paper.extend({
      styles: {
        root: {
          backgroundColor: 'rgba(11, 15, 17, 0.82)',
          backdropFilter: 'blur(10px)',
        },
      },
    }),
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
