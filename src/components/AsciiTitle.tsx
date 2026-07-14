import { Box } from '@mantine/core'

export const TITLE_ASCII = `
  __    _ _ _     _       _          _____                _    _____             
 | |  (_) | |   (_)     | |        / ____|              | |  |_   _|            
 | |     | | |__  _ _ __ | | __ _  | |  __ _ __ _ _ __ __| | ___| | _ __ _   _   
 | |    | | '_ \\| | '_ \\| |/ _\` | | | |_ | '__| | '_ \\ / _\` |/ _ \\| | '__| | | |  
 | |____| | |_) | | | | | | (_| | | |__| | |  | | | | | (_| | (_) | | |  | |_| |  
 |______|_|_.__/|_|_| |_|_|\\__,_|  \\_____|_|  |_|_| |_|\\__,_|\\___/|_|_|   \\__, |  
                                                                           __/ |  
  ~ little jam band tour ~                                              |___/   
`.trim()

export function AsciiTitle({ text }: { text: string }) {
  return (
    <Box
      component="pre"
      style={{
        fontFamily: 'monospace',
        fontSize: 9,
        lineHeight: 1.15,
        overflow: 'auto',
        color: '#9fd4c8',
        margin: 0,
      }}
    >
      {text}
    </Box>
  )
}
