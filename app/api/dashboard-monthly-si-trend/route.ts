import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!
);

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const referenceid = url.searchParams.get("referenceid");

    if (!referenceid) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01T00:00:00Z`;

    // Fetch all Delivered / Closed Transaction records for the current year
    const { data, error } = await supabase
      .from("history")
      .select("actual_sales, date_created")
      .eq("referenceid", referenceid)
      .eq("type_activity", "Delivered / Closed Transaction")
      .gte("date_created", startDate);

    if (error) throw error;

    // Aggregate actual_sales per month (0-indexed: 0 = Jan … 11 = Dec)
    const monthlyTotals = new Array(12).fill(0);

    for (const record of data ?? []) {
      const date = new Date(record.date_created);
      if (isNaN(date.getTime())) continue;
      const month = date.getMonth(); // 0-indexed
      monthlyTotals[month] += Number(record.actual_sales) || 0;
    }

    // Only return months up to the current month (no future zeroes)
    const currentMonth = new Date().getMonth(); // 0-indexed
    const months = MONTH_NAMES.slice(0, currentMonth + 1).map((name, i) => ({
      month: name,
      total: monthlyTotals[i],
    }));

    return NextResponse.json(
      { success: true, months },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching monthly SI trend:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch monthly SI trend." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
