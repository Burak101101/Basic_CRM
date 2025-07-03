'use client';

import { useDrag } from 'react-dnd';
import Link from 'next/link';
import { CurrencyDollarIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { OpportunityList } from '@/types/opportunities';

interface DraggableOpportunityCardProps {
  opportunity: OpportunityList;
}

const ItemType = 'OPPORTUNITY';

export default function DraggableOpportunityCard({ opportunity }: DraggableOpportunityCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: opportunity.id, currentStatus: opportunity.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'Kritik';
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  return (
    <div
      ref={drag}
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
          {opportunity.title}
        </h4>
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-500" />
          <span className="font-medium text-green-600">
            {opportunity.value.toLocaleString('tr-TR')} TL
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          <span className="font-medium">{opportunity.company_name}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(opportunity.priority)}`}>
            {getPriorityText(opportunity.priority)}
          </span>
          
          <span className="text-xs text-gray-500">
            {new Date(opportunity.expected_close_date).toLocaleDateString('tr-TR')}
          </span>
        </div>
        
        {opportunity.contact_count > 0 && (
          <div className="text-xs text-gray-500">
            {opportunity.contact_count} kişi
          </div>
        )}
      </div>
    </div>
  );
}
