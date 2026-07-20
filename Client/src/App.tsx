import { Routes, Route } from 'react-router';
import Home from './routes/Home'
import Create from './routes/Create';
import Room from './routes/Room';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
  <Toaster></Toaster>
  <Routes>
      <Route index element={<Home />} />
      <Route path='/create/:roomId' element={<Create />} />
      <Route path='/room/:roomId' element={<Room />} />
      {/* You can easily add more pages here later */}
      {/* <Route path="about" element={<About />} /> */}
  </Routes>
  </>
  )
}

export default App
