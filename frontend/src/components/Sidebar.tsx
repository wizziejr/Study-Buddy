import { NavLink } from 'react-router-dom';
import { BookOpen, Home, Library, Brain, Users, Settings } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export default function Sidebar({ isMobileOpen }: SidebarProps) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'AI Tutor', path: '/tutor', icon: Brain },
    { name: 'Notes Library', path: '/notes', icon: Library },
    { name: 'Past Papers', path: '/papers', icon: BookOpen },
    { name: 'Study Groups', path: '/groups', icon: Users },
  ];

  return (
    <aside className={`sidebar glass-panel ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="logo-container">
        <h1 className="logo-text">Study<span>Buddy</span></h1>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings className="nav-icon" size={20} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
