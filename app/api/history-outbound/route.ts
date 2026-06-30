import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const referenceid = url.searchParams.get("referenceid");
    const from = url.searchParams.get("from");
    const to   = url.searchParams.get("to");

    if (!referenceid) {
      return NextResponse.json({ success: false, error: "Missing reference ID." }, { status: 400 });
    }

    const now = new Date();
    const startDate = from
      ? `${from}T00:00:00Z`
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00Z`;
    const endDate = to ? `${to}T23:59:59Z` : null;

    let query = supabase
      .from("history")
      .select("*", { count: "exact" })
      .eq("referenceid", referenceid)
      .eq("source", "Outbound - Touchbase")
      .gte("date_created", startDate);

    if (endDate) query = query.lte("date_created", endDate);

    const { error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, count: count || 0 }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching outbound calls:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch outbound calls." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic"; // Always fetch latest data
