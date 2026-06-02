import { Routes, Route } from 'react-router-dom'
import Hero from './pages/Hero.jsx'
import Training from './pages/Training.jsx'
import Safety from './pages/Safety.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Hero />} />
      <Route path="/training" element={<Training />} />
      <Route path="/safety" element={<Safety />} />
    </Routes>
  )
}

export default App
