import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'
import './i18n/index.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </React.StrictMode>,
)
