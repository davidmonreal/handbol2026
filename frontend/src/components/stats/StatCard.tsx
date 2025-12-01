import type { StatCardProps } from './types';

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-600',
  green: 'bg-green-50 text-green-600 border-green-600',
  purple: 'bg-purple-50 text-purple-600 border-purple-600',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-600',
  orange: 'bg-orange-50 text-orange-600 border-orange-600',
  gray: 'bg-gray-50 text-gray-600 border-gray-600',
  red: 'bg-red-50 text-red-600 border-red-600',
};

const valueColorClasses = {
  blue: 'text-blue-800',
  green: 'text-green-800',
  purple: 'text-purple-800',
  yellow: 'text-yellow-800',
  orange: 'text-orange-800',
  gray: 'text-gray-800',
  red: 'text-red-800',
};

/**
 * StatCard - Displays a single statistic with label and value
 * Used in summary cards grid
 */
export function StatCard({ label, value, color = 'gray', className = '' }: StatCardProps) {
  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 ${className}`}>
      <div className={`text-sm ${color !== 'gray' ? 'font-medium' : ''}`}>{label}</div>
      <div className={`text-2xl font-bold ${valueColorClasses[color]}`}>{value}</div>
    </div>
  );
}
