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
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[now.getMonth()];

    if (!referenceId) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    const { data: targetData, error: targetError } = await supabase
      .from("sales_quotation")
      .select("quote_target")
      .eq("referenceid", referenceId)
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .maybeSingle();

    const quoteTarget = targetData ? Number(targetData.quote_target) || 0 : 0;

    return NextResponse.json(
      { success: true, quoteTarget },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching sales quotation:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch sales quotation." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic"; // Always fetch latest data
