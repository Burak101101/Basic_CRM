interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actionButton }: PageHeaderProps) {
  return (
    <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
      <div>
        <h3 className="text-2xl font-bold leading-6 text-gray-900">{title}</h3>
        {subtitle && <p className="mt-2 max-w-4xl text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actionButton && <div className="mt-3 sm:mt-0 sm:ml-4">{actionButton}</div>}
    </div>
  );
}
