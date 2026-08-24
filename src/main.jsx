import React from 'react'
import ReactDOM from 'react-dom/client'
import JadwalApp from './App.jsx'
import PublicPage from './PublicPage.jsx'
import './index.css'

const isPublic = window.location.pathname.startsWith('/publik');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPublic ? <PublicPage /> : <JadwalApp />}
  </React.StrictMode>,
)
