import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!
);

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export async function GET(req: Request) {
  try {
    const url        = new URL(req.url);
    const referenceid = url.searchParams.get("referenceid");

    if (!referenceid) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    const now          = new Date();
    const currentYear  = now.getFullYear().toString();
    const currentMonth = MONTH_NAMES[now.getMonth()]; // e.g. "June"

    const { data, error } = await supabase
      .from("sales_account_development")
      .select("count, target")
      .eq("referenceid", referenceid)
      .eq("month", currentMonth)
      .eq("year", currentYear);

    if (error) throw error;

    // Sum up all count and target values for the current month
    const totalCount  = (data ?? []).reduce((sum, row) => sum + (Number(row.count)  || 0), 0);
    const totalTarget = (data ?? []).reduce((sum, row) => sum + (Number(row.target) || 0), 0);

    return NextResponse.json(
      { success: true, count: totalCount, target: totalTarget, month: currentMonth, year: currentYear },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching sales account development:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch sales account development." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
