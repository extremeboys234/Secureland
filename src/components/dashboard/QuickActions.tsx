import React from 'react';
import Button from '../Button';
import { Upload, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Upload
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: keyof typeof iconMap;
  onClick?: () => void;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, onClick, color }) => {
  const LucideIcon = iconMap[icon];
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
    green: 'bg-green-50 hover:bg-green-100 text-green-600',
    yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600',
    red: 'bg-red-50 hover:bg-red-100 text-red-600',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all ${colorMap[color]}`} onClick={onClick}>
      <div className="flex items-center space-x-4 mb-4">
        <LucideIcon className="h-6 w-6" />
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onClick}>
        Get Started
      </Button>
    </div>
  );
};

interface QuickActionsProps {
  actions: Array<{
    title: string;
    description: string;
    icon: keyof typeof iconMap;
    onClick?: () => void;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }>;
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <QuickAction key={index} {...action} />
      ))}
    </div>
  );
};

export default QuickActions;
