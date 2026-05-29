import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

const BATCH_SIZE = 1000;

async function fetchTable(
  table: string,
  referenceid: string,
  fromDate?: string,
  toDate?: string
): Promise<any[]> {
  let allData: any[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(`referenceid, tsm, manager, type_activity, remarks, start_date, end_date, date_created`)
      .eq("manager", referenceid)
      .order("date_created", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (fromDate && toDate) {
      query = query.gte("date_created", fromDate).lte("date_created", toDate);
    }

    const { data, error } = await query;

    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;

    allData.push(...data);
    if (data.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return allData;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { referenceid, from, to } = req.query;

  if (!referenceid || typeof referenceid !== "string") {
    return res.status(400).json({ message: "Missing or invalid referenceid" });
  }

  const fromDate = typeof from === "string" ? from : undefined;
  const toDate   = typeof to   === "string" ? to   : undefined;

  try {
    const [history, meetings, documentation] = await Promise.all([
      fetchTable("history",       referenceid, fromDate, toDate),
      fetchTable("meetings",      referenceid, fromDate, toDate),
      fetchTable("documentation", referenceid, fromDate, toDate),
    ]);

    const combinedData = [...history, ...meetings, ...documentation].sort(
      (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
    );

    return res.status(200).json({
      activities: combinedData,
      total: combinedData.length,
      cached: false,
    });
  } catch (err: any) {
    console.error("Server error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}
