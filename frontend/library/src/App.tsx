import './App.css'
import '@/components/ui/title-animation.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/components/Home'
import Mission from '@/components/Mission'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mission" element={<Mission />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
