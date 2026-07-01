import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!
);

const SPF_TYPES = ["spf - special project", "spf - local", "spf - foreign"];

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
    if (agentIds.length === 0)
      return NextResponse.json({ success: true, total: 0, totalRegular: 0, totalSPF: 0 }, { status: 200 });

    const currentYear = new Date().getFullYear().toString();
    const startDate   = from ? `${from}T00:00:00Z` : `${currentYear}-01-01T00:00:00Z`;
    const endDate     = to   ? `${to}T23:59:59Z`   : null;

    let q = supabase.from("history").select("so_amount, call_type")
      .in("referenceid", agentIds)
      .eq("status", "SO-Done")
      .gte("date_created", startDate);
    if (endDate) q = q.lte("date_created", endDate);

    const { data, error } = await q;
    if (error) throw error;

    let totalRegular = 0;
    let totalSPF     = 0;
    (data ?? []).forEach(item => {
      const amount   = Number(item.so_amount) || 0;
      const callType = (item.call_type || "").toLowerCase();
      if (SPF_TYPES.includes(callType)) totalSPF += amount;
      else totalRegular += amount;
    });

    const total = totalRegular + totalSPF;
    return NextResponse.json({ success: true, total, totalRegular, totalSPF }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
