"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiWeightedScoresProps {
  name?: string;
  loading?: boolean;

  // 1. Sales Performance SO/SI — 50%
  runningTarget?: number;
  totalActualSales?: number;

  // 2. OB Calls — 10%
  obCallsCount?: number;
  obCallsTarget?: number;

  // 3. Quotes Generated — 10%
  quotesCount?: number;
  quotesTarget?: number;

  // 4. Conversion Metrics (Calls→Quote + Quote→SO + SO→SI) — combined 5%
  callsToQuotesCount?: number;
  obCallsForRatio?: number;
  quoteToSOSalesOrderCount?: number;
  quoteToSOQuotationCount?: number;
  soToSIDeliveredCount?: number;
  soToSISalesOrderCount?: number;

  // 5. Client Visits — 10%, target 80/month
  clientVisits?: number;
  clientVisitsTarget?: number;

  // 6. CSR Metrics (Response Time + Quotation HT + Non-Quotation HT) — combined 5%
  avgResponseTime?: number;     // in hours
  avgQuotationHT?: number;      // in hours
  avgNonQuotationHT?: number;   // in hours

  // 7. New Account Development — 10%, target 2/month
  newAccountCount?: number;
  newAccountTarget?: number;
}

// ─── Rating helpers ───────────────────────────────────────────────────────────

/** Standard: ≥91%→5 | 81-90%→4 | 61-80%→3 | 50-60%→2 | <50%→1 */
function standardRating(pct: number): number {
  if (pct >= 91) return 5;
  if (pct >= 81) return 4;
  if (pct >= 61) return 3;
  if (pct >= 50) return 2;
  return 1;
}

/** Calls→Quote: raw % vs 20% target */
function callsToQuoteRating(pct: number): number {
  if (pct >= 20)    return 5;
  if (pct >= 14.01) return 4;
  if (pct >= 12.01) return 3;
  if (pct >= 10.01) return 2;
  return 1;
}

/** Quote→SO: raw % vs 30% target */
function quoteToSORating(pct: number): number {
  if (pct >= 30)    return 5;
  if (pct >= 25.01) return 4;
  if (pct >= 20.01) return 3;
  if (pct >= 15.01) return 2;
  return 1;
}

/** SO→SI: raw % vs 70% target */
function soToSIRating(pct: number): number {
  if (pct >= 70)    return 5;
  if (pct >= 60.01) return 4;
  if (pct >= 50.01) return 3;
  if (pct >= 40.01) return 2;
  return 1;
}

/**
 * Response Time rating — value in hours, target ≤10 min (0.1667 hrs)
 * No data (0) → 1
 * ≤10min→5 | 11-20min→4 | 21-30min→3 | 31-40min→2 | 41min+→1
 */
function responseTimeRating(hours: number): number {
  if (hours <= 0) return 1;  // no data
  const mins = hours * 60;
  if (mins <= 10)  return 5;
  if (mins <= 20)  return 4;
  if (mins <= 30)  return 3;
  if (mins <= 40)  return 2;
  return 1;
}

/**
 * Quotation HT rating — value in hours, target ≤8 hrs
 * No data (0) → 1
 * ≤8hrs→5 | 8.01-9→4 | 9.01-10→3 | 10.01-11→2 | 11+→1
 */
function quotationHTRating(hours: number): number {
  if (hours <= 0) return 1;  // no data
  if (hours <= 8)   return 5;
  if (hours <= 9)   return 4;
  if (hours <= 10)  return 3;
  if (hours <= 11)  return 2;
  return 1;
}

/**
 * Non-Quotation HT rating — value in hours, target ≤24 hrs
 * No data (0) → 1
 * ≤24hrs→5 | 25-30→4 | 31-35→3 | 36-40→2 | 41+→1
 */
function nonQuotationHTRating(hours: number): number {
  if (hours <= 0) return 1;  // no data
  if (hours <= 24) return 5;
  if (hours <= 30) return 4;
  if (hours <= 35) return 3;
  if (hours <= 40) return 2;
  return 1;
}

// ─── Score label ──────────────────────────────────────────────────────────────

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 5) return { label: "Always Demonstrated",       color: "text-yellow-600" };
  if (score >= 4.5) return { label: "Often Demonstrated",       color: "text-green-600" };
  if (score >= 3.5) return { label: "Regularly Demonstrated",    color: "text-emerald-500" };
  if (score >= 2.5) return { label: "Occasionaly Demonstrated",      color: "text-blue-500" };
  if (score >= 1.5) return { label: "Seldom Demonstrated", color: "text-amber-500" };
  return             { label: "Seldom Demonstrated",          color: "text-red-500" };
}

function barColor(score: number): string {
  if (score >= 4.5) return "#16a34a";
  if (score >= 3.5) return "#10b981";
  if (score >= 2.5) return "#3b82f6";
  if (score >= 1.5) return "#f59e0b";
  return "#ef4444";
}

// ─── KPI row type ─────────────────────────────────────────────────────────────

interface KpiRow {
  label: string;
  weight: number;
  achievementPct: number;
  rating: number;
  weightedScore: number;
}

// ─── Row component ────────────────────────────────────────────────────────────

const KpiRowItem: React.FC<{ row: KpiRow }> = ({ row }) => {
  const weightedMax = row.weight * 5;
  const fillPct     = weightedMax > 0 ? (row.weightedScore / weightedMax) * 100 : 0;
  const ratingColor =
    row.rating >= 4 ? "text-green-600" :
    row.rating >= 3 ? "text-blue-500"  :
    row.rating >= 2 ? "text-amber-500" :
                      "text-red-500";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 truncate">{row.label}</span>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
            {Math.round(row.weight * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-gray-100 h-1 rounded-full">
            <div
              className="h-1 rounded-full transition-all"
              style={{ width: `${Math.min(fillPct, 100)}%`, backgroundColor: barColor(row.rating) }}
            />
          </div>
          <span className="text-[10px] font-mono text-gray-400 shrink-0">
            {row.achievementPct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="text-center w-8 shrink-0">
        <span className={`text-sm font-extrabold ${ratingColor}`}>{row.rating}</span>
        <p className="text-[9px] text-gray-400 leading-none">rating</p>
      </div>
      <div className="text-right w-14 shrink-0">
        <span className="text-sm font-extrabold text-gray-800">
          {row.weightedScore.toFixed(2)}
        </span>
        <p className="text-[9px] text-gray-400 leading-none">of {weightedMax.toFixed(2)}</p>
      </div>
    </div>
  );
};

// ─── Main card ────────────────────────────────────────────────────────────────

export const KpiWeightedScores: React.FC<KpiWeightedScoresProps> = ({
  name                    = "—",
  loading                 = false,
  runningTarget           = 0,
  totalActualSales        = 0,
  obCallsCount            = 0,
  obCallsTarget           = 0,
  quotesCount             = 0,
  quotesTarget            = 120,
  callsToQuotesCount      = 0,
  obCallsForRatio         = 0,
  quoteToSOSalesOrderCount = 0,
  quoteToSOQuotationCount  = 0,
  soToSIDeliveredCount    = 0,
  soToSISalesOrderCount   = 0,
  clientVisits            = 0,
  clientVisitsTarget      = 80,
  avgResponseTime         = 0,
  avgQuotationHT          = 0,
  avgNonQuotationHT       = 0,
  newAccountCount         = 0,
  newAccountTarget        = 2,
}) => {

  // ── 1. Sales SO/SI — 50% ──────────────────────────────────────────────────
  const salesPct    = runningTarget > 0 ? (totalActualSales / runningTarget) * 100 : 0;
  const salesRating = standardRating(salesPct);
  const salesW      = 0.50 * salesRating;

  // ── 2. OB Calls — 10% ────────────────────────────────────────────────────
  const obPct       = obCallsTarget > 0 ? (obCallsCount / obCallsTarget) * 100 : 0;
  const obRating    = standardRating(obPct);
  const obW         = 0.10 * obRating;

  // ── 3. Quotes Generated — 10% ────────────────────────────────────────────
  const quotesPct    = quotesTarget > 0 ? (quotesCount / quotesTarget) * 100 : 0;
  const quotesRating = standardRating(quotesPct);
  const quotesW      = 0.10 * quotesRating;

  // ── 4. Conversion Metrics — combined 5% ──────────────────────────────────
  const c2qRawPct       = obCallsForRatio > 0 ? (callsToQuotesCount / obCallsForRatio) * 100 : 0;
  const c2qRating       = callsToQuoteRating(c2qRawPct);
  const c2qAchievePct   = (c2qRawPct / 20) * 100;

  const q2soPct         = quoteToSOQuotationCount > 0
    ? (quoteToSOSalesOrderCount / quoteToSOQuotationCount) * 100 : 0;
  const q2soRating      = quoteToSORating(q2soPct);
  const q2soAchievePct  = (q2soPct / 30) * 100;

  const s2siPct         = soToSISalesOrderCount > 0
    ? (soToSIDeliveredCount / soToSISalesOrderCount) * 100 : 0;
  const s2siRating      = soToSIRating(s2siPct);
  const s2siAchievePct  = (s2siPct / 70) * 100;

  const convRating      = Math.round((c2qRating + q2soRating + s2siRating) / 3);
  const convAchievePct  = (c2qAchievePct + q2soAchievePct + s2siAchievePct) / 3;
  const convW           = 0.05 * convRating;

  // ── 5. Client Visits — 10% ───────────────────────────────────────────────
  const cvPct    = clientVisitsTarget > 0 ? (clientVisits / clientVisitsTarget) * 100 : 0;
  const cvRating = standardRating(cvPct);
  const cvW      = 0.10 * cvRating;

  // ── 6. CSR Metrics — combined 5% ────────────────────────────────────────
  const rtRating      = responseTimeRating(avgResponseTime);
  const rtAchievePct  = avgResponseTime > 0
    ? Math.min(((10 / 60) / avgResponseTime) * 100, 100) : 0;

  const qhtRating     = quotationHTRating(avgQuotationHT);
  const qhtAchievePct = avgQuotationHT > 0
    ? Math.min((8 / avgQuotationHT) * 100, 100) : 0;

  const nqhtRating     = nonQuotationHTRating(avgNonQuotationHT);
  const nqhtAchievePct = avgNonQuotationHT > 0
    ? Math.min((24 / avgNonQuotationHT) * 100, 100) : 0;

  const csrRating     = Math.round((rtRating + qhtRating + nqhtRating) / 3);
  const csrAchievePct = (rtAchievePct + qhtAchievePct + nqhtAchievePct) / 3;
  const csrW          = 0.05 * csrRating;

  // ── 7. New Account Development — 10%, target 2/month ─────────────────────
  const naPct    = newAccountTarget > 0 ? (newAccountCount / newAccountTarget) * 100 : 0;
  const naRating = standardRating(naPct);
  const naW      = 0.10 * naRating;

  // ── Total (50+10+10+5+10+5+10 = 100%) ────────────────────────────────────
  const totalScore   = salesW + obW + quotesW + convW + cvW + csrW + naW;
  const { label: statusLabel, color: statusColor } = scoreLabel(totalScore);
  const totalFillPct = (totalScore / 5) * 100;

  const rows: KpiRow[] = [
    {
      label: "Sales Performance (SO/SI)",
      weight: 0.50,
      achievementPct: salesPct,
      rating: salesRating,
      weightedScore: salesW,
    },
    {
      label: "OB Calls",
      weight: 0.10,
      achievementPct: obPct,
      rating: obRating,
      weightedScore: obW,
    },
    {
      label: "Quotes Generated",
      weight: 0.10,
      achievementPct: quotesPct,
      rating: quotesRating,
      weightedScore: quotesW,
    },
    {
      label: "Conversion Metrics (Calls→Quote · Quote→SO · SO→SI)",
      weight: 0.05,
      achievementPct: convAchievePct,
      rating: convRating,
      weightedScore: convW,
    },
    {
      label: "Client Visits (target: 80/mo)",
      weight: 0.10,
      achievementPct: cvPct,
      rating: cvRating,
      weightedScore: cvW,
    },
    {
      label: "CSR Metrics (Response Time · Quotation HT · Non-Quotation HT)",
      weight: 0.05,
      achievementPct: csrAchievePct,
      rating: csrRating,
      weightedScore: csrW,
    },
    {
      label: "New Account Development (target: 2/mo)",
      weight: 0.10,
      achievementPct: naPct,
      rating: naRating,
      weightedScore: naW,
    },
  ];

  return (
    <Card className="bg-white z-10 text-black flex flex-col">
      <CardContent className="flex-1 flex flex-col p-6 gap-4">

        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
          KPI weighted scores (out of 5.0)
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-xs text-gray-400">
            <Spinner className="w-4 h-4" />
            <span>Calculating scores...</span>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">

            {/* ── Score summary ── */}
            <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-3 min-w-[200px] md:w-56 shrink-0">
              <p className="text-sm font-semibold text-gray-800">{name}</p>
              <p className={`text-5xl font-extrabold leading-none ${statusColor}`}>
                {totalScore.toFixed(2)}
              </p>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(totalFillPct, 100)}%`,
                    backgroundColor: barColor(totalScore),
                  }}
                />
              </div>
              <p className={`text-xs font-medium ${statusColor}`}>{statusLabel}</p>
            </div>

            {/* ── KPI breakdown ── */}
            <div className="flex-1 flex flex-col justify-center divide-y divide-gray-50">
              {rows.map((row) => (
                <KpiRowItem key={row.label} row={row} />
              ))}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
};
