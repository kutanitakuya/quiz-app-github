import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Host from "./pages/Host";
import Participant from "./pages/participant";

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4">クイズアプリ</h1>

        <nav className="space-x-4 mb-6">
          <Link to="/host" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            出題者
          </Link>
          <Link to="/participant" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            参加者
          </Link>
        </nav>

        <Routes>
          <Route path="/host" element={<Host />} />
          <Route path="/participant" element={<Participant />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;