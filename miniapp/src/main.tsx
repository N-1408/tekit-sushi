import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { StoreProvider } from './lib/store'
import { initTelegram } from './lib/tg'
import './index.css'

initTelegram()
// Muvaffaqiyatli ishga tushdi: keyingi xatolik uchun bir martalik tiklanish yana ruxsatli.
try { sessionStorage.removeItem('tk-boot-retry') } catch {}
// Dinamik import (chunk) yuklanmasa — bir marta, cheklangan reload.
window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('tk-boot-retry')) return
    sessionStorage.setItem('tk-boot-retry', '1')
    window.location.reload()
  } catch {}
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoreProvider>
  </React.StrictMode>,
)
