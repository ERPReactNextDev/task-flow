"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementData {
  name: string;
  referenceid: string;
  siPercentage: number;
  soPercentage: number;
}

interface SiSoAchievementCardProps {
  referenceid: string;
  /** SI target % — default 70 */
  siTarget?: number;
  /** SO target % — default 30 */
  soTarget?: number;
  dateRange?: { from?: Date; to?: Date };
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, target, unit }: any) => {
  if (!active || !payload?.length) return null;
  const value: number = payload[0]?.value ?? 0;
  const achievement = target > 0 ? Math.round((value / target) * 100) : 0;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-bold text-gray-800 mb-1">{label}</p>
      <p className="text-gray-600">
        {unit}:{" "}
        <span className="font-mono font-bold text-gray-900">
          {value.toFixed(1)}%
        </span>
      </p>
      <p className="text-gray-500">
        Target: <span className="font-mono">{target}%</span>
      </p>
      <p
        className={`font-bold ${
          achievement >= 100
            ? "text-green-600"
            : achievement >= 70
            ? "text-yellow-600"
            : "text-red-600"
        }`}
      >
        Achievement: {achievement}%
      </p>
    </div>
  );
};

// ─── Single chart panel ───────────────────────────────────────────────────────

const AchievementChart: React.FC<{
  title: string;
  data: { name: string; value: number }[];
  target: number;
  unit: string;
}> = ({ title, data, target, unit }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const domain = Math.max(target * 1.5, maxValue * 1.2, 10);

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        {title}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          barCategoryGap="40%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            domain={[0, domain]}
            width={42}
          />
          <Tooltip
            content={<CustomTooltip target={target} unit={unit} />}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <ReferenceLine
            y={target}
            stroke="#6b7280"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: `${target}% target`,
              position: "insideTopRight",
              fontSize: 9,
              fill: "#9ca3af",
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
            {data.map((entry, index) => {
              const pct = target > 0 ? (entry.value / target) * 100 : 0;
              const color =
                pct >= 100 ? "#16a34a" : pct >= 70 ? "#ca8a04" : "#dc2626";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Main card ────────────────────────────────────────────────────────────────

export const SiSoAchievementCard: React.FC<SiSoAchievementCardProps> = ({
  referenceid,
  siTarget = 70,
  soTarget = 30,
  dateRange,
}) => {
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    if (!referenceid) return;
    setLoading(true);
    setError(null);
    const url = new URL("/api/dashboard-si-so-achievement", window.location.origin);
    url.searchParams.append("referenceid", referenceid);
    if (dateRange?.from) url.searchParams.append("from", dateRange.from.toISOString().slice(0, 10));
    if (dateRange?.to)   url.searchParams.append("to",   dateRange.to.toISOString().slice(0, 10));
    fetch(url.toString())
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch SI/SO data");
        return res.json();
      })
      .then((d) => {
        setData({
          name: d.name,
          referenceid: d.referenceid,
          siPercentage: d.siPercentage ?? 0,
          soPercentage: d.soPercentage ?? 0,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [referenceid]);

  useEffect(() => {
    fetchData();
  }, [fetchData, dateRange]);

  const siChartData = data ? [{ name: data.name, value: data.siPercentage }] : [];
  const soChartData = data ? [{ name: data.name, value: data.soPercentage }] : [];

  return (
    <Card className="bg-white z-10 text-black flex flex-col">
      <CardContent className="flex-1 flex flex-col items-start justify-start p-6 gap-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-600">
          SI vs SO achievement by TSA
        </div>

        {loading ? (
          <div className="flex items-center justify-center w-full h-40 gap-2 text-xs text-gray-400">
            <Spinner className="w-5 h-5" />
            <span>Loading chart data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center w-full h-40 gap-2">
            <span className="text-3xl grayscale opacity-30">⚠️</span>
            <p className="text-xs font-bold uppercase tracking-widest text-red-400">
              {error}
            </p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center w-full h-40 gap-2">
            <span className="text-3xl grayscale opacity-30">📊</span>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              No data available
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 w-full">
            <AchievementChart
              title="SI % achievement"
              data={siChartData}
              target={siTarget}
              unit="SI %"
            />
            <div className="hidden md:block w-px bg-gray-100 self-stretch" />
            <AchievementChart
              title="SO achievement"
              data={soChartData}
              target={soTarget}
              unit="SO %"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
