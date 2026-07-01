import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const referenceid = req.query.referenceid as string;
    const month = req.query.month as string; // optional YYYY-MM
    const year = req.query.year as string; // optional YYYY

    if (!referenceid) {
      return res.status(400).json({ error: "Reference ID is required" });
    }

    // Calculate date range — full current year (YTD)
    const now        = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const yearStart  = `${targetYear}-01-01`;
    const yearEnd    = `${targetYear}-12-31`;

    // Fetch count from account_development_plans table for the full year
    const { data: plans, error: plansError } = await supabase
      .from("account_development_plans")
      .select("id")
      .eq("referenceid", referenceid)
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd);

    if (plansError) throw plansError;

    res.status(200).json({ count: plans?.length || 0, target: 2 });
  } catch (error) {
    console.error("Error fetching account development plan count:", error);
    res.status(500).json({ error: "Server error" });
  }
}
