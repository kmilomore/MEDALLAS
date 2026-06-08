import { GoogleOAuthProvider } from '@react-oauth/google'
import { Route, Routes } from 'react-router-dom'
import AdminDashboard from './components/AdminDashboard'
import DirectorPortal from './components/DirectorPortal'
import { AuthProvider } from './context/AuthContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<DirectorPortal />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<DirectorPortal />} />
        </Routes>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
