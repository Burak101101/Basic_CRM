import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function Card({ title, subtitle, children, footer, className = '' }: CardProps) {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      {(title || subtitle) && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          {title && <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
      {footer && <div className="px-4 py-4 sm:px-6 bg-gray-50">{footer}</div>}
    </div>
  );
}
