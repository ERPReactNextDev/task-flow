"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface OutboundTouchbaseCountCardProps {
  referenceid?: string;
  count?: number;
  target?: number;
  loading?: boolean;
  loadingTarget?: boolean;
}

export const OutboundTouchbaseCountCard: React.FC<OutboundTouchbaseCountCardProps> = ({
  referenceid,
  count = 0,
  target = 0,
  loading = false,
  loadingTarget = false,
}) => {
  const percentage = target > 0 ? Math.round((count / target) * 100) : 0;

  return (
    <Card className="bg-white z-10 text-black flex flex-col">
      <CardContent className="flex-1 flex flex-col items-start justify-start p-6 gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-600">
          TOTAL OB CALLS
        </div>
        <div className="text-4xl font-extrabold text-gray-900">
          {loading ? <Spinner className="w-8 h-8" /> : count}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
            {percentage}% of {loadingTarget ? "..." : target}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
