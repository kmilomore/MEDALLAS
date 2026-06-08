import { Route, Routes } from 'react-router-dom'
import AdminDashboard from './components/AdminDashboard'
import DirectorPortal from './components/DirectorPortal'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DirectorPortal />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<DirectorPortal />} />
    </Routes>
  )
}

export default App
