import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!
);

async function getAgentIds(tsm: string): Promise<string[]> {
  const { data } = await supabase.from("users").select("ReferenceID")
    .eq("TSM", tsm).eq("Role", "Territory Sales Associate")
    .not("Status", "in", '("Resigned","Terminated","Inactive")');
  return (data ?? []).map((a) => a.ReferenceID);
}

export async function GET(req: Request) {
  try {
    const url  = new URL(req.url);
    const tsm  = url.searchParams.get("tsm");
    const from = url.searchParams.get("from");
    const to   = url.searchParams.get("to");

    if (!tsm) return NextResponse.json({ success: false, error: "Missing tsm." }, { status: 400 });

    const agentIds = await getAgentIds(tsm);
    if (agentIds.length === 0) return NextResponse.json({ success: true, total: 0 }, { status: 200 });

    const currentYear = new Date().getFullYear().toString();
    const startDate   = from ? `${from}T00:00:00Z` : `${currentYear}-01-01T00:00:00Z`;
    const endDate     = to   ? `${to}T23:59:59Z`   : null;

    let q = supabase.from("history").select("actual_sales")
      .in("referenceid", agentIds)
      .eq("type_activity", "Delivered / Closed Transaction")
      .gte("date_created", startDate);
    if (endDate) q = q.lte("date_created", endDate);

    const { data, error } = await q;
    if (error) throw error;

    const total = (data ?? []).reduce((sum, r) => sum + (Number(r.actual_sales) || 0), 0);
    return NextResponse.json({ success: true, total }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
