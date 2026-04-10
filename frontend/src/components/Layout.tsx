import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <main className="main-content">
        <Navbar toggleSidebar={() => setIsMobileOpen(!isMobileOpen)} />
        <div className="page-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
