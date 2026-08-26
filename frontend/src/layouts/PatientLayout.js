import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PatientSidebar from '../components/patient/PatientSidebar';
import PatientHeader from '../components/patient/PatientHeader';
import CartDrawer from '../components/patient/CartDrawer';
import { CartProvider } from '../context/CartContext';
import { useMedicineReminderAlerts } from '../hooks/useMedicineReminderAlerts';

const PatientShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useMedicineReminderAlerts();

  return (
    <div className="h-screen overflow-hidden bg-[#f7f8fa] font-sans text-ink-900">
      <div className="flex h-full">
        <PatientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PatientHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="scrollbar-hide flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      <CartDrawer />
    </div>
  );
};

const PatientLayout = () => (
  <CartProvider>
    <PatientShell />
  </CartProvider>
);

export default PatientLayout;
