import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  children,
}) => {
  const baseClasses = `transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium ${
    block ? 'w-full' : 'inline-flex items-center justify-center'
  }`;

  const variantClasses = {
    primary: `bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`,
    secondary: `bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`,
    outline: `border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`,
    danger: `bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2`,
    success: `bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2`,
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
    >
      {children}
    </button>
  );
};

export default Button;
