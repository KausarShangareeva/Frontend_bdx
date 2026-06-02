import { Routes, Route } from 'react-router-dom'
import Hero from './pages/Hero.jsx'
import Training from './pages/Training.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Hero />} />
      <Route path="/training" element={<Training />} />
    </Routes>
  )
}

export default App
