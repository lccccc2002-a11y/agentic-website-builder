import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import BuilderPage from '@/pages/BuilderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/builder/:projectId" element={<BuilderPage />} />
      </Routes>
    </BrowserRouter>
  )
}
