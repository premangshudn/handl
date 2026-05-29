import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerSW } from 'virtual:pwa-register'

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

// Register service worker for installability and offline support
registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
