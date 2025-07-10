import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import DcmSession from './components/DcmSession';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dcm/:sessionId" element={<DcmSession />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
