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
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[now.getMonth()]; // Get full month name

    console.log("Received referenceid for sales ob target:", referenceid, "Year:", currentYear, "Month:", currentMonth);

    if (!referenceid) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sales_ob")
      .select("ob_target")
      .eq("referenceid", referenceid)
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .single();

    if (error) {
      console.error("Supabase error fetching sales ob target:", error);
      // If no record found, return 0 as target
      return NextResponse.json(
        { success: true, target: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, target: Number(data.ob_target) || 0 },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching sales ob target:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch sales ob target." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic"; // Always fetch latest data
