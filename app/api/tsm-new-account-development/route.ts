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
    const url = new URL(req.url);
    const tsm = url.searchParams.get("tsm");

    if (!tsm) {
      return NextResponse.json({ success: false, error: "Missing tsm." }, { status: 400 });
    }

    const now          = new Date();
    const currentYear  = now.getFullYear().toString();
    const currentMonth = MONTH_NAMES[now.getMonth()];

    // Query sales_account_development by tsm column for current month/year
    const { data, error } = await supabase
      .from("sales_account_development")
      .select("count, target")
      .eq("tsm", tsm)
      .eq("month", currentMonth)
      .eq("year", currentYear);

    if (error) throw error;

    const totalCount  = (data ?? []).reduce((sum, row) => sum + (Number(row.count)  || 0), 0);
    const totalTarget = (data ?? []).reduce((sum, row) => sum + (Number(row.target) || 0), 0);

    return NextResponse.json(
      { success: true, count: totalCount, target: totalTarget, month: currentMonth, year: currentYear },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching TSM new account development:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
