import { Routes, Route } from 'react-router';
import Home from './routes/Home'
import About from './routes/About';
import Create from './routes/Create';
import Room from './routes/Room';

function App() {
  return (
  <Routes>
      <Route index element={<Home />} />
      <Route path='/about' element={<About />} />
      <Route path='/create/:roomId' element={<Create />} />
      <Route path='/room/:roomId' element={<Room />} />
      {/* You can easily add more pages here later */}
      {/* <Route path="about" element={<About />} /> */}
  </Routes>
  )
}

export default App
