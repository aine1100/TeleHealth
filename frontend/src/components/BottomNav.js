import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Clock, Pill, User } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/patient/home', icon: Home, label: 'Home' },
    { path: '/patient/doctors', icon: Calendar, label: 'Book' },
    { path: '/patient/appointments', icon: Clock, label: 'Queue' },
    { path: '/patient/medicines', icon: Pill, label: 'Meds' },
    { path: '/patient/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-6 py-3 flex justify-around items-center md:hidden shadow-[0_-1px_20px_rgba(15,23,42,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 ${isActive ? 'text-blue-950' : 'text-slate-400'}`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
