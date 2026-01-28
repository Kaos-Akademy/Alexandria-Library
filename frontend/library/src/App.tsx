import './App.css'
import '@/components/ui/title-animation.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/components/Home'
import Mission from '@/components/Mission'
import Donation from '@/components/Donation'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mission" element={<Mission />} />
        <Route path="/donate" element={<Donation />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
