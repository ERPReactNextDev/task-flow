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
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed

    console.log("Received referenceid for outbound calls:", referenceid, "Year:", currentYear, "Month:", currentMonth);

    if (!referenceid) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    // Get first day of current month
    const startDate = `${currentYear}-${currentMonth}-01T00:00:00Z`;

    const { data, error, count } = await supabase
      .from("history")
      .select("*", { count: "exact" })
      .eq("referenceid", referenceid)
      .eq("source", "Outbound - Touchbase")
      .gte("date_created", startDate);

    if (error) throw error;

    return NextResponse.json(
      { success: true, count: count || 0 },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching outbound calls:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch outbound calls." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic"; // Always fetch latest data
