import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const referenceid = req.query.referenceid as string;
  const year = req.query.year as string;
  const month = req.query.month as string;

  if (!referenceid) {
    return res.status(400).json({ error: "referenceid query parameter is required" });
  }

  try {
    let query = supabase
      .from("site_visit_target")
      .select("*")
      .eq("referenceid", referenceid);

    if (year) {
      query = query.eq("year", year);
    }
    if (month) {
      query = query.eq("month", month);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return res.status(200).json({ success: true, target: null });
      }
      throw error;
    }

    res.status(200).json({ success: true, target: data });
  } catch (error) {
    console.error("Error fetching site visit target:", error);
    res.status(500).json({ error: "Server error fetching site visit target" });
  }
}
