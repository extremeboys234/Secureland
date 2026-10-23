import React from 'react';

interface WelcomeCardProps {
  title: string;
  subtitle: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  );
};

export default WelcomeCard;
