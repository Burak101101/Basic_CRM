'use client';

import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface AIButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  children?: React.ReactNode;
}

export default function AIButton({
  onClick,
  loading = false,
  disabled = false,
  size = 'md',
  variant = 'primary',
  className = '',
  children
}: AIButtonProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        ${loading ? 'cursor-wait' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSize[size]} mr-2`} />
      ) : (
        <SparklesIcon className={`${iconSize[size]} mr-2`} />
      )}
      {children || 'AI Asistan'}
    </button>
  );
}
