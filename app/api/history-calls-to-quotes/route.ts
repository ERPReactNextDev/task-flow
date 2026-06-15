import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const referenceId = url.searchParams.get("referenceid");
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

    if (!referenceId) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    const startDate = `${currentYear}-${currentMonth}-01T00:00:00Z`;

    // Fetch all relevant records for the month
    const { data: historyData, error: historyError } = await supabase
      .from("history")
      .select("activity_reference_number, source, type_activity")
      .eq("referenceid", referenceId)
      .gte("date_created", startDate);

    if (historyError) throw historyError;

    // Group records by activity_reference_number
    const activityGroups = new Map();

    historyData?.forEach(record => {
      if (!record.activity_reference_number) return;

      if (!activityGroups.has(record.activity_reference_number)) {
        activityGroups.set(record.activity_reference_number, {
          hasOutbound: false,
          hasQuotation: false
        });
      }

      const group = activityGroups.get(record.activity_reference_number);

      if (record.source === "Outbound - Touchbase") {
        group.hasOutbound = true;
      }

      if (record.type_activity === "Quotation Preparation") {
        group.hasQuotation = true;
      }
    });

    // Count groups that have both
    let count = 0;
    activityGroups.forEach(group => {
      if (group.hasOutbound && group.hasQuotation) {
        count++;
      }
    });

    return NextResponse.json(
      { success: true, count },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching calls to quotes:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch calls to quotes." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
