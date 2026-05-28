import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LOGO_IMAGE_URL, SYSTEM_NAME } from './app/branding'

document.title = SYSTEM_NAME
document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', LOGO_IMAGE_URL)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
