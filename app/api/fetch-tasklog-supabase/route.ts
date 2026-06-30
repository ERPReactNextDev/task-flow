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
    const from        = url.searchParams.get("from"); // YYYY-MM-DD
    const to          = url.searchParams.get("to");   // YYYY-MM-DD

    if (!referenceid) {
      return NextResponse.json(
        { success: false, error: "Missing referenceid." },
        { status: 400 }
      );
    }

    let query = supabase
      .from("tasklog")
      .select(`id, "ReferenceID", "Type", "Status", "Remarks", "SiteVisitAccount", "Location", "Latitude", "Longitude", "PhotoURL", date_created`)
      .eq("ReferenceID", referenceid)
      .order("date_created", { ascending: false })
      .limit(500);

    if (from) query = query.gte("date_created", `${from}T00:00:00+08:00`);
    if (to)   query = query.lte("date_created", `${to}T23:59:59+08:00`);

    const { data, error } = await query;
    if (error) throw error;

    // Normalise to the same shape the frontend already expects
    const siteVisits = (data ?? []).map((row) => ({
      Type:             row.Type,
      Status:           row.Status,
      date_created:     row.date_created,
      Location:         row.Location,
      Latitude:         row.Latitude,
      Longitude:        row.Longitude,
      PhotoURL:         row.PhotoURL,
      SiteVisitAccount: row.SiteVisitAccount,
    }));

    return NextResponse.json({ success: true, siteVisits }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching tasklog from Supabase:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch tasklog." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
