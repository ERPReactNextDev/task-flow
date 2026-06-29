"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ListTree } from "lucide-react";
import { type DateRange } from "react-day-picker";

interface Activity {
  start_date?: string;
  end_date?: string;
  type_activity?: string;
  duration?: number;
}

interface TotalTimeSpentCardProps {
  referenceid: string;
  dateRange?: DateRange;
  name?: string;
  activities?: Activity[];
  loading?: boolean;
  error?: string | null;
}

// Convert ISO date string to PH local date string (YYYY-MM-DD)
const toLocalDateString = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
}

function barColor(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#3b82f6";
  if (score >= 30) return "#f59e0b";
  return "#ef4444";
}

export function TotalTimeSpentCard({
  referenceid,
  dateRange,
  name = "—",
  activities: externalActivities,
  loading: externalLoading,
  error: externalError,
}: TotalTimeSpentCardProps) {
  const [open, setOpen] = useState(false);
  const [internalActivities, setInternalActivities] = useState<Activity[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Use current date if dateRange not provided
  const today = useMemo(() => toLocalDateString(new Date()), []);
  const fromDate = dateRange?.from ? toLocalDateString(dateRange.from) : today;
  const toDate = dateRange?.to ? toLocalDateString(dateRange.to) : today;

  // Fetch activities internally if not provided externally
  useEffect(() => {
    if (externalActivities) return; // If activities are passed in, don't fetch

    const fetchData = async () => {
      setInternalLoading(true);
      setInternalError(null);
      try {
        const res = await fetch(
          `/api/activity/tsa/breaches/fetch?referenceid=${encodeURIComponent(referenceid)}&from=${fromDate}&to=${toDate}&fetchAll=true`
        );
        if (!res.ok) throw new Error("Failed to fetch activities");
        const data = await res.json();
        setInternalActivities(data.activities || []);
      } catch (err: any) {
        setInternalError(err.message);
      } finally {
        setInternalLoading(false);
      }
    };

    if (referenceid) fetchData();
  }, [referenceid, fromDate, toDate, externalActivities]);

  const activities = externalActivities || internalActivities;
  const loading = externalLoading ?? internalLoading;
  const error = externalError ?? internalError;

  // Calculate total time
  const totalMs = useMemo(() => {
    return activities.reduce((acc, entry) => {
      if (entry.start_date && entry.end_date) {
        const start = new Date(entry.start_date).getTime();
        const end = new Date(entry.end_date).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) return acc + (end - start);
      } else if (entry.duration) return acc + entry.duration * 1000;
      return acc;
    }, 0);
  }, [activities]);

  const grandSeconds = Math.floor(totalMs / 1000);
  const grandHours = Math.floor(grandSeconds / 3600);
  const grandMinutes = Math.floor((grandSeconds % 3600) / 60);
  const grandTotalHours = grandHours + grandMinutes / 60;

  const MAX_HOURS = 7.5;
  const percentage = MAX_HOURS > 0 ? Math.min(Math.round((grandTotalHours / MAX_HOURS) * 100), 100) : 0;

  // Duration per activity type
  const durationPerType = useMemo(() => {
    return activities.reduce((acc, entry) => {
      const type = entry.type_activity || "Other";
      let duration = 0;

      if (entry.start_date && entry.end_date) {
        const start = new Date(entry.start_date).getTime();
        const end = new Date(entry.end_date).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          duration = end - start;
        }
      } else if (entry.duration) {
        duration = entry.duration * 1000;
      }

      if (duration > 0) {
        acc[type] = (acc[type] || 0) + duration;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [activities]);

  return (
    <>
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
              Total Time Spent
            </p>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <ListTree className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-4 max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Work Hours per Activity</SheetTitle>
                  <SheetDescription>Breakdown of total work hours by activity type.</SheetDescription>
                </SheetHeader>

                <div className="mt-4">
                  {Object.keys(durationPerType).length === 0 ? (
                    <p className="text-sm text-gray-500">No activities with time recorded.</p>
                  ) : (
                    Object.entries(durationPerType).map(([type, ms], i) => (
                      <React.Fragment key={type}>
                        {i > 0 && <Separator className="my-2" />}
                        <div className="flex justify-between text-xs font-medium py-1 w-full">
                          <span>{type}</span>
                          <span>{formatDuration(ms)}</span>
                        </div>
                      </React.Fragment>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-400">
              <Spinner className="w-4 h-4" />
              <span>Loading…</span>
            </div>
          ) : error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{name}</span>
                  <span className="text-sm font-bold" style={{ color: barColor(percentage) }}>
                    {grandHours}h {grandMinutes}m / {MAX_HOURS}h
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: barColor(percentage),
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
