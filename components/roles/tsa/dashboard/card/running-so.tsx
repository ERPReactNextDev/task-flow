"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface RunningSoCardProps {
  referenceid?: string;
  targetTotal?: number; // Optional prop to pass target for percentage calculation
  total?: number;
  loading?: boolean;
}

export const RunningSoCard: React.FC<RunningSoCardProps> = ({
  referenceid,
  targetTotal = 8750000, // Default to 8.75M if not provided
  total = 0,
  loading = false,
}) => {
  const currentYear = new Date().getFullYear();

  // Format number to display as full amount
  const formatAmount = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Calculate percentage achieved
  const calculatePercentage = (actual: number, target: number) => {
    if (target <= 0) return 0;
    return Math.round((actual / target) * 100);
  };

  const percentage = calculatePercentage(total, targetTotal);

  return (
    <Card className="bg-white z-10 text-black flex flex-col">
      <CardContent className="flex-1 flex flex-col items-start justify-start p-6 gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-600">
          RUNNING SO ACTUAL
        </div>
        <div className="text-2xl md:text-3xl font-extrabold text-gray-900 break-all">
          {loading ? <Spinner className="w-6 h-6" /> : formatAmount(total)}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
            {percentage}% achieved
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
