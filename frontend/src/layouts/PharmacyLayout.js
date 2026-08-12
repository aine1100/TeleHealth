import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PharmacySidebar from '../components/pharmacy/PharmacySidebar';
import PharmacyHeader from '../components/pharmacy/PharmacyHeader';

const PharmacyLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#f7f8fa] font-sans text-ink-900">
      <div className="flex h-full">
        <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PharmacyHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="scrollbar-hide flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default PharmacyLayout;
