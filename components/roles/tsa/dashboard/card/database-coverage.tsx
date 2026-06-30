"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface Activity {
  company_name?: string;
  customer_name?: string;
  company?: string;
  date_created?: string;
  [key: string]: any;
}

interface ClusterAccount {
  company_name?: string;
  type_client?: string;
  [key: string]: any;
}

interface DatabaseCoverageCardProps {
  referenceid: string;
  name?: string;
  fromDate?: string;
  toDate?: string;
}

// Normalize a company name: lowercase → collapse whitespace → strip trailing dot(s)
const normalizeCompany = (name: string): string =>
  (name || "").toLowerCase().replace(/\s+/g, " ").trim().replace(/\.+$/, "");

// Convert ISO date string to PH local date string (YYYY-MM-DD)
const toLocalDateString = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
};

function barColor(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#3b82f6";
  if (score >= 30) return "#f59e0b";
  return "#ef4444";
}

export function DatabaseCoverageCard({
  referenceid,
  name = "—",
  fromDate,
  toDate,
}: DatabaseCoverageCardProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clusterAccounts, setClusterAccounts] = useState<ClusterAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use current date if fromDate/toDate not provided
  const today = useMemo(() => toLocalDateString(new Date()), []);
  const effectiveFromDate = fromDate || today;

  // Compute month range from effectiveFromDate
  const monthRange = useMemo(() => {
    const d = new Date(effectiveFromDate + "T00:00:00Z");
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const monthStart = new Date(Date.UTC(year, month, 1)).toISOString().split("T")[0];
    const monthEnd = new Date(Date.UTC(year, month + 1, 0)).toISOString().split("T")[0];
    return { monthStart, monthEnd };
  }, [effectiveFromDate]);

  // Fetch data
  useEffect(() => {
    if (!referenceid) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch cluster accounts
        const clusterRes = await fetch(
          `/api/com-fetch-cluster-account?referenceid=${encodeURIComponent(referenceid)}`
        );
        if (!clusterRes.ok) throw new Error("Failed to fetch cluster accounts");
        const clusterData = await clusterRes.json();
        
        // Filter cluster accounts (same logic as breaches.tsx)
        const excludedStatuses = ["removed", "approved for deletion", "subject for transfer"];
        const allowedTypes = ["top 50", "next 30", "balance 20", "tsa client", "csr client", "new client"];
        const filteredAccounts: ClusterAccount[] = (clusterData.data || []).filter((a: any) => {
          const status = (a.status || "").toLowerCase();
          const typeClient = (a.type_client || "").toLowerCase();
          return (
            status &&
            typeClient &&
            !excludedStatuses.includes(status) &&
            allowedTypes.includes(typeClient)
          );
        });
        setClusterAccounts(filteredAccounts);

        // Fetch activities (full month)
        const activitiesRes = await fetch(
          `/api/activity/tsa/breaches/fetch?referenceid=${encodeURIComponent(referenceid)}&from=${monthRange.monthStart}&to=${monthRange.monthEnd}&fetchAll=true`
        );
        if (!activitiesRes.ok) throw new Error("Failed to fetch activities");
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [referenceid, monthRange.monthStart, monthRange.monthEnd]);

  // Compute covered accounts
  const coveredCount = useMemo(() => {
    if (!clusterAccounts.length || !activities.length) return 0;

    // Collect touched company names (full month)
    const touchedCompanyNames = new Set<string>();
    
    const monthStart = Date.UTC(
      new Date(effectiveFromDate + "T00:00:00Z").getUTCFullYear(),
      new Date(effectiveFromDate + "T00:00:00Z").getUTCMonth(),
      1, 0, 0, 0, 0
    );
    const monthEnd = Date.UTC(
      new Date(effectiveFromDate + "T00:00:00Z").getUTCFullYear(),
      new Date(effectiveFromDate + "T00:00:00Z").getUTCMonth() + 1,
      0, 23, 59, 59, 999
    );

    activities.forEach((act) => {
      const companyName = act.company_name || act.customer_name || act.company;
      if (!companyName || !act.date_created) return;

      // Parse date_created as a literal date string (ignore timezone offset)
      const dateStr = act.date_created.toString().split("T")[0];
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!y || !m || !d) return;
      const t = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
      if (isNaN(t) || t < monthStart || t > monthEnd) return;

      touchedCompanyNames.add(normalizeCompany(companyName));
    });

    // Count covered accounts
    const covered = clusterAccounts.filter((acc) =>
      acc.company_name && touchedCompanyNames.has(normalizeCompany(acc.company_name))
    );

    return covered.length;
  }, [clusterAccounts, activities, effectiveFromDate]);

  const totalCount = clusterAccounts.length;
  const percentage = totalCount > 0 ? Math.min(Math.round((coveredCount / totalCount) * 100), 100) : 0;

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
          DB Coverage
        </p>

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
                  {coveredCount.toLocaleString()}/{totalCount.toLocaleString()}
                </span>
              </div>
              {totalCount > 0 && (
                <div className="w-full bg-gray-200 h-1.5 rounded-full">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: barColor(percentage),
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
