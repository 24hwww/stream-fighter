import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ArcadeContainer from './components/arcade/ArcadeContainer.jsx';
import MobileVoting from './components/vote/MobileVoting.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <main className="w-screen h-screen overflow-hidden bg-black">
            <ArcadeContainer />
          </main>
        } />
        <Route path="/vote" element={<MobileVoting />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
