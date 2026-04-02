'use client';

import React from 'react';
import { FaSpinner } from 'react-icons/fa';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'amber';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 rounded-xl';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200',
    secondary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200',
    outline: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200',
    amber: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
    icon: 'p-2.5',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <FaSpinner className="w-4 h-4 animate-spin mr-2" />
      ) : (
        leftIcon && <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
