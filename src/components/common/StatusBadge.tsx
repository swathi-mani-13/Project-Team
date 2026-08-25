import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getStyles = () => {
    switch (status) {
      case 'Present':
      case 'Active':
      case 'Success':
      case 'Approved':
      case 'Connected':
      case 'Normal':
      case 'Recognized':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';

      case 'Late':
      case 'Warning':
      case 'Pending':
      case 'Investigating':
      case 'Calibrating':
      case 'Low Confidence':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/80';

      case 'Absent':
      case 'Critical':
      case 'Rejected':
      case 'Offline':
      case 'Failed':
      case 'Deactivated':
      case 'Unknown Face':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/80';

      case 'Streaming':
      case 'Live':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80 animate-pulse';

      case 'Presence Unverified':
      case 'Presence Not Detected':
      case 'Medical Leave':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/80';

      case 'On Duty':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80';

      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizeStyles} ${getStyles()} ${className}`}
    >
      {status}
    </span>
  );
};
