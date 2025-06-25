import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";

import Dcmvi from "./Screens/dcmViewer";
import Footer from "./components/Footer";
import Home from "./Screens/Home";

function App() {
    return (
        <div className="flex flex-col min-h-screen"> {/* Flexbox Container */}
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} /> {/* Home page */}
                    <Route path="/viewer/:doctorName/:datasetName" element={<Dcmvi />} />
                </Routes>
            </Router>

            <Footer /> {/* Footer will stick to the bottom */}
        </div>
    );
}

export default App;
