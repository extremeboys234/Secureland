import React from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  FileText,
  Users,
  type LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  FileText,
  Users
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof iconMap;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const LucideIcon = iconMap[icon];
  const colorMap: Record<string, string> = {
    blue: 'blue-500',
    green: 'green-500',
    yellow: 'yellow-500',
    red: 'red-500',
    purple: 'purple-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex-1">
      <div className="flex items-center mb-3">
        <LucideIcon className={`h-5 w-5 text-${colorMap[color]} mr-3`} />
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

interface StatsCardsProps {
  stats: Array<{
    label: string;
    value: string | number;
    icon: keyof typeof iconMap;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }>;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsCards;
