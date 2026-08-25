import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'indigo',
  trend,
  onClick,
}) => {
  const getStyles = () => {
    switch (colorScheme) {
      case 'emerald':
        return {
          icon: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          accent: 'hover:border-emerald-500/50',
          text: 'text-emerald-400',
        };
      case 'amber':
        return {
          icon: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          accent: 'hover:border-amber-500/50',
          text: 'text-amber-400',
        };
      case 'rose':
        return {
          icon: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          accent: 'hover:border-rose-500/50',
          text: 'text-rose-400',
        };
      case 'cyan':
        return {
          icon: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          accent: 'hover:border-cyan-500/50',
          text: 'text-cyan-400',
        };
      case 'purple':
        return {
          icon: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          accent: 'hover:border-purple-500/50',
          text: 'text-purple-400',
        };
      default:
        return {
          icon: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          accent: 'hover:border-indigo-500/50',
          text: 'text-indigo-400',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl glass-panel transition-all ${
        styles.accent
      } ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
          {title}
        </span>
        <div
          className={`h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center ${styles.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-2xl font-extrabold text-white tracking-tight font-mono">
          {value}
        </p>

        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-bold ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-1 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
