import { Route, Routes } from 'react-router-dom'
import AdminDashboard from './components/AdminDashboard'
import DirectorPortal from './components/DirectorPortal'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<DirectorPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<DirectorPortal />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
