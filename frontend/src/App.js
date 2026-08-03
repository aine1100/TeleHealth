import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/patient/Home';
import FindDoctor from './pages/patient/FindDoctor';
import Appointments from './pages/patient/Appointments';
import Medicines from './pages/patient/Medicines';
import Notifications from './pages/patient/Notifications';
import Profile from './pages/patient/Profile';
import AIScreening from './pages/patient/AIScreening';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/patient/home" element={<Home />} />
            <Route path="/patient/doctors" element={<FindDoctor />} />
            <Route path="/patient/appointments" element={<Appointments />} />
            <Route path="/patient/medicines" element={<Medicines />} />
            <Route path="/patient/notifications" element={<Notifications />} />
            <Route path="/patient/profile" element={<Profile />} />
            <Route path="/patient/ai-screening" element={<AIScreening />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <ToastContainer position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
