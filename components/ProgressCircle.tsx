import React from 'react';

interface ProgressCircleProps {
  progress: number;
  total: number;
  size?: number;
  showTotal?: boolean;
}

export const ProgressCircle = ({ progress, total, size = 40, showTotal = false }: ProgressCircleProps) => {
  const percentage = Math.min(100, Math.max(0, (progress / total) * 100));
  const radius = (size - 16) / 2; // More padding
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: showTotal ? size + 20 : size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="4"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        <div className="absolute flex items-center justify-center w-full h-full top-0 left-0">
          <span className="font-bold text-slate-900" style={{ fontSize: size / 4 }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {showTotal && (
        <span className="text-xs text-slate-500 mt-1">{progress}/{total}</span>
      )}
    </div>
  );
};
