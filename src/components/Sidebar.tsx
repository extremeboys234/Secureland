import React, { useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  FileText,
  History,
  LogOut,
  ShieldCheck,
  Users,
  Folder,
  FileSearch,
  Award,
  BookOpen,
  ClipboardCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authService';

interface SidebarProps {
  activeItem: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', active: 'dashboard' },
    { name: 'Upload Document', icon: Upload, href: '/upload', active: 'upload' },
    { name: 'My Documents', icon: FileText, href: '/documents', active: 'documents' },
    { name: 'Verification History', icon: History, href: '/history', active: 'history' },
    { name: 'Security Center', icon: ShieldCheck, href: '/security', active: 'security' },
  ];

  const adminNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard', active: 'admin-dashboard' },
    { name: 'Users', icon: Users, href: '/users', active: 'users' },
    { name: 'Documents', icon: Folder, href: '/documents', active: 'documents' },
    { name: 'Pending Verification', icon: ClipboardCheck, href: '/admin/pending-verification', active: 'pending-review' },
    { name: 'Verification Records', icon: History, href: '/history', active: 'history' },
    { name: 'Trusted References', icon: BookOpen, href: '/references', active: 'references' },
    { name: 'Issuers', icon: Award, href: '/issuers', active: 'issuers' },
    { name: 'Audit Logs', icon: FileSearch, href: '/audit', active: 'audit' },
    { name: 'Security Center', icon: ShieldCheck, href: '/security', active: 'security' },
  ];

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      window.location.assign('/login');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to log out. Please try again.');
    }
  };

  const goTo = (href: string) => {
    setIsOpen(false);
    navigate(href);
  };

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation"
      >
        <span />
        <span />
        <span />
      </button>
      {isOpen && <button className="sidebar-backdrop" onClick={() => setIsOpen(false)} aria-label="Close navigation" />}
      <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold text-gray-800">SecureLand</span>
        </div>
      </div>
      <div className="sidebar-mobile-title">
        <span>Navigation</span>
        <button type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation">×</button>
      </div>
      <nav className="sidebar-nav">
        <p className="sidebar-group-label">{isAdmin ? 'Overview' : 'Workspace'}</p>
        {(isAdmin ? adminNavItems : navItems).map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="sidebar-nav-row">
              <button
                onClick={() => goTo(item.href)}
                className={`sidebar-nav-item ${activeItem === item.active ? 'active' : ''}`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </button>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-account">
        <p className="sidebar-group-label">Account</p>
        <div className="sidebar-profile">
          <div className="sidebar-avatar">AR</div>
          <div>
            <p className="text-sm font-bold text-slate-800">Seba Rao</p>
            <p className="text-xs text-slate-500">{isAdmin ? 'Administrator' : 'Owner'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-logout"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Logout</span>
        </button>
        {logoutError && <p role="alert" className="mt-2 text-xs text-red-700">{logoutError}</p>}
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
