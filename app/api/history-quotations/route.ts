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
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // 06 for June
    const startDate = `${currentYear}-${currentMonth}-01T00:00:00Z`;

    console.log("Received referenceid for approved quotations:", referenceid, "Start date:", startDate);

    if (!referenceid) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    const { data, error, count } = await supabase
      .from("history")
      .select("quotation_number", { count: "exact" })
      .eq("referenceid", referenceid)
      .eq("type_activity", "Quotation Preparation")
      .or("tsm_approved_status.eq.Approved By Sales Head,tsm_approved_status.eq.Approved")
      .gte("date_created", startDate);

    console.log("Supabase response for quotations:", { data, error, count });
    if (error) throw error;

    return NextResponse.json(
      { success: true, count: count || 0 },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching approved quotations:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch approved quotations." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic"; // Always fetch latest data
