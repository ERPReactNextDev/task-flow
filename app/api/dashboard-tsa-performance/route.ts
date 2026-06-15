import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { connectToDatabase } from "@/lib/mongodb";

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

    const now          = new Date();
    const currentYear  = now.getFullYear().toString();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const yearStart    = `${currentYear}-01-01T00:00:00Z`;
    const monthStart   = `${currentYear}-${currentMonth}-01T00:00:00Z`;

    // ── All queries run in parallel — no internal API calls ──────────────────
    const [
      userRes,
      quotaRes,
      siRes,
      soRes,
      outboundRes,
      quotationsRes,
      pipelineRes,
      clientVisitCount,
    ] = await Promise.all([

      // 1. User name
      supabase
        .from("users")
        .select("Firstname, Lastname")
        .eq("ReferenceID", referenceid)
        .single(),

      // 2. Running target — sum of YTD sales_quota amounts
      supabase
        .from("sales_quota")
        .select("amount")
        .eq("referenceid", referenceid)
        .eq("year", currentYear),

      // 3. Running SI — sum of actual_sales YTD (Delivered / Closed Transaction)
      supabase
        .from("history")
        .select("actual_sales")
        .eq("referenceid", referenceid)
        .eq("type_activity", "Delivered / Closed Transaction")
        .gte("date_created", yearStart),

      // 4. Running SO — sum of so_amount YTD (SO-Done)
      supabase
        .from("history")
        .select("so_amount")
        .eq("referenceid", referenceid)
        .eq("status", "SO-Done")
        .gte("date_created", yearStart),

      // 5. OB Calls count — current month Outbound - Touchbase
      supabase
        .from("history")
        .select("id", { count: "exact", head: true })
        .eq("referenceid", referenceid)
        .eq("source", "Outbound - Touchbase")
        .gte("date_created", monthStart),

      // 6. Approved quotations count — current month
      supabase
        .from("history")
        .select("quotation_number", { count: "exact" })
        .eq("referenceid", referenceid)
        .eq("type_activity", "Quotation Preparation")
        .or("tsm_approved_status.eq.Approved By Sales Head,tsm_approved_status.eq.Approved")
        .gte("date_created", monthStart),

      // 7. Pipeline records — current month, used to derive SI% and SO%
      //    (same grouping logic as history-quote-to-so and history-so-to-si routes)
      supabase
        .from("history")
        .select("activity_reference_number, source, type_activity")
        .eq("referenceid", referenceid)
        .gte("date_created", monthStart),

      // 8. Client visits — MongoDB TaskLog Login count for current month
      connectToDatabase().then((db) =>
        db.collection("TaskLog").countDocuments({
          ReferenceID: referenceid,
          Status: "Login",
          date_created: { $gte: new Date(monthStart) },
        })
      ),
    ]);

    // ── Running Target ────────────────────────────────────────────────────────
    if (quotaRes.error) throw quotaRes.error;
    const runningTarget = (quotaRes.data ?? []).reduce(
      (sum, r) => sum + (Number(r.amount) || 0), 0
    );

    // ── Running SI ────────────────────────────────────────────────────────────
    if (siRes.error) throw siRes.error;
    const runningSI = (siRes.data ?? []).reduce(
      (sum, r) => sum + (Number(r.actual_sales) || 0), 0
    );

    // ── Running SO ────────────────────────────────────────────────────────────
    if (soRes.error) throw soRes.error;
    const runningSO = (soRes.data ?? []).reduce(
      (sum, r) => sum + (Number(r.so_amount) || 0), 0
    );

    // ── OB Calls ──────────────────────────────────────────────────────────────
    if (outboundRes.error) throw outboundRes.error;
    const obCalls = outboundRes.count ?? 0;

    // ── Quotations ────────────────────────────────────────────────────────────
    if (quotationsRes.error) throw quotationsRes.error;
    const quotationsCount = quotationsRes.count ?? 0;

    // ── SI % and SO % — activity grouping ────────────────────────────────────
    if (pipelineRes.error) throw pipelineRes.error;

    const groups = new Map<
      string,
      { hasOutbound: boolean; hasQuotation: boolean; hasSalesOrder: boolean; hasDelivered: boolean }
    >();

    for (const rec of pipelineRes.data ?? []) {
      if (!rec.activity_reference_number) continue;
      if (!groups.has(rec.activity_reference_number)) {
        groups.set(rec.activity_reference_number, {
          hasOutbound: false,
          hasQuotation: false,
          hasSalesOrder: false,
          hasDelivered: false,
        });
      }
      const g = groups.get(rec.activity_reference_number)!;
      if (rec.source === "Outbound - Touchbase")                          g.hasOutbound   = true;
      if (rec.type_activity === "Quotation Preparation")                  g.hasQuotation  = true;
      if (rec.type_activity === "Sales Order Preparation")                g.hasSalesOrder = true;
      if (rec.type_activity === "Delivered / Closed Transaction")         g.hasDelivered  = true;
    }

    let quoteToSOQuotationCount  = 0;
    let quoteToSOSalesOrderCount = 0;
    let soToSISalesOrderCount    = 0;
    let soToSIDeliveredCount     = 0;

    groups.forEach((g) => {
      if (g.hasOutbound && g.hasQuotation)                                         quoteToSOQuotationCount++;
      if (g.hasOutbound && g.hasQuotation && g.hasSalesOrder)                      quoteToSOSalesOrderCount++;
      if (g.hasOutbound && g.hasQuotation && g.hasSalesOrder)                      soToSISalesOrderCount++;
      if (g.hasOutbound && g.hasQuotation && g.hasSalesOrder && g.hasDelivered)    soToSIDeliveredCount++;
    });

    const soPercentage = quoteToSOQuotationCount > 0
      ? Math.round((quoteToSOSalesOrderCount / quoteToSOQuotationCount) * 100)
      : 0;

    const siPercentage = soToSISalesOrderCount > 0
      ? Math.round((soToSIDeliveredCount / soToSISalesOrderCount) * 100)
      : 0;

    // ── User name ─────────────────────────────────────────────────────────────
    const userName = userRes.data
      ? `${userRes.data.Firstname ?? ""} ${userRes.data.Lastname ?? ""}`.trim()
      : referenceid;

    // ── Status — based on SI% vs 70% target ──────────────────────────────────
    const siTarget = 70;
    const status: "On track" | "At risk" | "Below target" =
      siPercentage >= siTarget            ? "On track"     :
      siPercentage >= siTarget * 0.7      ? "At risk"      :
                                            "Below target";

    return NextResponse.json(
      {
        success: true,
        name: userName,
        referenceid,
        runningTarget,
        runningSI,
        runningSO,
        siPercentage,
        soPercentage,
        obCalls,
        quotationsCount,
        clientVisits: clientVisitCount,
        status,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching TSA performance detail:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch TSA performance detail." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
