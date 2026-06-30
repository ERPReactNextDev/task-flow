import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!
);

const SPF_TYPES = ["spf - special project", "spf - local", "spf - foreign"];

export async function GET(req: Request) {
  try {
    const Xchire_url = new URL(req.url);
    const referenceId = Xchire_url.searchParams.get("referenceid");
    const from = Xchire_url.searchParams.get("from");
    const to   = Xchire_url.searchParams.get("to");

    if (!referenceId) {
      return NextResponse.json({ success: false, error: "Missing reference ID." }, { status: 400 });
    }

    const currentYear = new Date().getFullYear().toString();
    const startDate = from ? `${from}T00:00:00Z` : `${currentYear}-01-01T00:00:00Z`;
    const endDate   = to ? `${to}T23:59:59Z` : null;

    let query = supabase
      .from("history")
      .select("so_amount, call_type")
      .eq("referenceid", referenceId)
      .eq("status", "SO-Done")
      .gte("date_created", startDate);

    if (endDate) query = query.lte("date_created", endDate);

    const { data, error } = await query;
    if (error) throw error;

    let totalRegular = 0;
    let totalSPF = 0;

    data?.forEach(item => {
      const amount = Number(item.so_amount) || 0;
      const callType = (item.call_type || "").toLowerCase();
      if (SPF_TYPES.includes(callType)) {
        totalSPF += amount;
      } else {
        totalRegular += amount;
      }
    });

    const total = totalRegular + totalSPF;

    return NextResponse.json({ success: true, total, totalRegular, totalSPF }, { status: 200 });
  } catch (Xchire_error: any) {
    console.error("Error fetching history so:", Xchire_error);
    return NextResponse.json({ success: false, error: Xchire_error.message || "Failed to fetch history so." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic"; // Always fetch latest data
