'use client';

import { useDrop } from 'react-dnd';
import { KanbanColumn } from '@/types/opportunities';
import DraggableOpportunityCard from './DraggableOpportunityCard';

interface DroppableColumnProps {
  column: KanbanColumn;
  onDrop: (opportunityId: number, newStatusId: number) => void;
}

const ItemType = 'OPPORTUNITY';

export default function DroppableColumn({ column, onDrop }: DroppableColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemType,
    drop: (item: { id: number; currentStatus: number }) => {
      if (item.currentStatus !== column.status_id) {
        onDrop(item.id, column.status_id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`bg-gray-50 rounded-lg p-4 min-h-[500px] transition-colors ${
        isActive ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
      } ${isOver && !canDrop ? 'bg-red-50' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.status_color }}
          />
          <h3 className="font-medium text-gray-900">{column.status_name}</h3>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {column.count}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {column.total_value.toLocaleString('tr-TR')} TL
        </div>
      </div>

      {/* Drop Zone Indicator */}
      {isActive && (
        <div className="mb-4 p-3 border-2 border-blue-300 border-dashed rounded-lg bg-blue-50 text-center">
          <p className="text-sm text-blue-600 font-medium">Fırsatı buraya bırakın</p>
        </div>
      )}

      {/* Opportunities */}
      <div className="space-y-3">
        {column.opportunities.map((opportunity) => (
          <DraggableOpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
          />
        ))}
      </div>

      {/* Empty State */}
      {column.opportunities.length === 0 && !isActive && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Bu durumda fırsat bulunmuyor</p>
        </div>
      )}
    </div>
  );
}
