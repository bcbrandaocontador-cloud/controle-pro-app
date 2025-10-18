import React from 'react';
import { ObligationStatus } from '../../types';

interface BadgeProps {
  // FIX: The `status` prop type was updated to a string literal union to be compatible with both `Obligation` and `Task` status types.
  status: `${ObligationStatus}` | 'Resolvido';
}

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const colorClasses: Record<string, string> = {
    [ObligationStatus.Pendente]: 'bg-yellow-100 text-yellow-800',
    [ObligationStatus.EmAndamento]: 'bg-blue-100 text-blue-800',
    [ObligationStatus.Entregue]: 'bg-green-100 text-green-800',
    [ObligationStatus.Vencido]: 'bg-red-100 text-red-800',
    'Resolvido': 'bg-green-100 text-green-800',   // for tasks
  };

  const classes = colorClasses[status] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${classes}`}>
      {status}
    </span>
  );
};

export default Badge;