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

    if (!referenceid) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    // Current month start date
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00Z`;

    // Fetch user's name and history in parallel
    const [userRes, historyRes] = await Promise.all([
      supabase
        .from("users")
        .select("Firstname, Lastname")
        .eq("ReferenceID", referenceid)
        .single(),
      supabase
        .from("history")
        .select("activity_reference_number, source, type_activity")
        .eq("referenceid", referenceid)
        .gte("date_created", startDate),
    ]);

    if (userRes.error) throw userRes.error;
    if (historyRes.error) throw historyRes.error;

    const user = userRes.data;
    const name = user
      ? `${user.Firstname ?? ""} ${user.Lastname ?? ""}`.trim()
      : referenceid;

    // Group by activity_reference_number — same logic as existing routes
    const activityGroups = new Map<
      string,
      {
        hasOutbound: boolean;
        hasQuotation: boolean;
        hasSalesOrder: boolean;
        hasDelivered: boolean;
      }
    >();

    for (const record of historyRes.data ?? []) {
      if (!record.activity_reference_number) continue;

      if (!activityGroups.has(record.activity_reference_number)) {
        activityGroups.set(record.activity_reference_number, {
          hasOutbound: false,
          hasQuotation: false,
          hasSalesOrder: false,
          hasDelivered: false,
        });
      }

      const group = activityGroups.get(record.activity_reference_number)!;

      if (record.source === "Outbound - Touchbase") group.hasOutbound = true;
      if (record.type_activity === "Quotation Preparation") group.hasQuotation = true;
      if (record.type_activity === "Sales Order Preparation") group.hasSalesOrder = true;
      if (record.type_activity === "Delivered / Closed Transaction") group.hasDelivered = true;
    }

    // SO counts (denominator = groups that reached SO stage)
    let soToSISalesOrderCount = 0;
    let soToSIDeliveredCount = 0;

    // Quote → SO counts (denominator = groups that have a quotation)
    let quoteToSOQuotationCount = 0;
    let quoteToSOSalesOrderCount = 0;

    activityGroups.forEach((group) => {
      // Quote → SO
      if (group.hasOutbound && group.hasQuotation) {
        quoteToSOQuotationCount++;
      }
      if (group.hasOutbound && group.hasQuotation && group.hasSalesOrder) {
        quoteToSOSalesOrderCount++;
      }

      // SO → SI
      if (group.hasOutbound && group.hasQuotation && group.hasSalesOrder) {
        soToSISalesOrderCount++;
      }
      if (group.hasOutbound && group.hasQuotation && group.hasSalesOrder && group.hasDelivered) {
        soToSIDeliveredCount++;
      }
    });

    const soPercentage =
      quoteToSOQuotationCount > 0
        ? Math.round((quoteToSOSalesOrderCount / quoteToSOQuotationCount) * 100 * 10) / 10
        : 0;

    const siPercentage =
      soToSISalesOrderCount > 0
        ? Math.round((soToSIDeliveredCount / soToSISalesOrderCount) * 100 * 10) / 10
        : 0;

    return NextResponse.json(
      {
        success: true,
        name,
        referenceid,
        soPercentage,
        siPercentage,
        // raw counts — useful for tooltips or debugging
        quoteToSOQuotationCount,
        quoteToSOSalesOrderCount,
        soToSISalesOrderCount,
        soToSIDeliveredCount,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching SI/SO achievement:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch SI/SO achievement." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
