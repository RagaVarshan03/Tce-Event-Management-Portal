import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SocketProvider } from './context/SocketContext.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <GoogleOAuthProvider clientId="246133639220-hfj69r9b8ds234tuu1goqkl9fbm0ckj5.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
    </SocketProvider>
  </StrictMode>,
)
