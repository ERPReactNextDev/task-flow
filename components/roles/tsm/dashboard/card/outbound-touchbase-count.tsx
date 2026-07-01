"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Settings } from "lucide-react";

interface OutboundTouchbaseCountCardProps {
  referenceid?: string;
  count?: number;
  target?: number;
  loading?: boolean;
  loadingTarget?: boolean;
  userId?: string;
}

export const OutboundTouchbaseCountCard: React.FC<OutboundTouchbaseCountCardProps> = ({
  referenceid,
  count = 0,
  target = 0,
  loading = false,
  loadingTarget = false,
  userId = "",
}) => {
  const router     = useRouter();
  const percentage = target > 0 ? Math.round((count / target) * 100) : 0;

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams(window.location.search);
    const id = userId || params.get("id") || "";
    router.push(`/roles/tsm/ob-breakdown${id ? `?id=${encodeURIComponent(id)}` : ""}`);
  };

  return (
    <Card className="bg-white z-10 text-black flex flex-col">
      <CardContent className="flex-1 flex flex-col items-start justify-start p-6 gap-2">
        <div className="flex items-center justify-between w-full">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-600">
            TOTAL OB CALLS
          </div>
          <button
            onClick={handleSettings}
            className="relative z-20 p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="OB calls breakdown"
            title="View OB calls breakdown by agent"
            type="button"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
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
