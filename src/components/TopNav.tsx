import React from 'react';
import { Bell, MessageSquare, Search, User } from 'lucide-react';

interface TopNavProps {
  title: string;
}

const TopNav: React.FC<TopNavProps> = ({ title }) => {
  return (
    <header className="app-header">
      <div className="header-title">
        <span className="header-kicker">SECURE PROPERTY RECORDS</span>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        <div className="header-search">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-[50%] -translate-y-[50%]" />
          <input
            type="text"
            placeholder="Search documents..."
            className="header-search-input"
          />
        </div>
        <button type="button" className="header-icon" aria-label="Notifications">
          <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">3</span>
        </button>
        <button type="button" className="header-icon" aria-label="Messages">
          <MessageSquare className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">1</span>
        </button>
        <div className="header-profile">
          <div className="header-avatar">AR</div>
          <span>Seba Rao</span>
          <User className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default TopNav;
