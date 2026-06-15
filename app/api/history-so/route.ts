import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!
);

export async function GET(req: Request) {
  try {
    const Xchire_url = new URL(req.url);
    const referenceId = Xchire_url.searchParams.get("referenceid");
    const currentYear = new Date().getFullYear().toString();

    console.log("Received referenceid:", referenceId, "Year:", currentYear);

    if (!referenceId) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    // Get January 1st of current year
    const startDate = `${currentYear}-01-01T00:00:00Z`;

    const { data, error } = await supabase
      .from("history")
      .select("so_amount")
      .eq("referenceid", referenceId)
      .eq("status", "SO-Done")
      .gte("date_created", startDate);

    if (error) throw error;

    const total = data?.reduce((sum, item) => sum + (Number(item.so_amount) || 0), 0) || 0;

    // ✅ Standardized response format
    return NextResponse.json(
      { success: true, total },
      { status: 200 }
    );
  } catch (Xchire_error: any) {
    console.error("Error fetching history so:", Xchire_error);
    return NextResponse.json(
      { success: false, error: Xchire_error.message || "Failed to fetch history so." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic"; // Always fetch latest data
