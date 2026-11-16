import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-800/80 rounded border border-slate-700/30 ${className}`}
    />
  );
};

export const KpiCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 6 }) => {
  return (
    <tr className="border-b border-slate-800 animate-pulse">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="p-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
};
