import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const userId = req.query.userId as string;
    const companyName = req.query.company_name as string;
    const referenceId = req.query.referenceid as string;

    let query = supabase.from("account_development_plans").select("*");

    if (userId) {
      query = query.eq("user_id", parseInt(userId));
    }
    if (companyName) {
      query = query.eq("customer_name", companyName);
    }
    if (referenceId) {
      query = query.eq("referenceid", referenceId);
    }

    query = query.order("created_at", { ascending: false });

    const { data: plans, error: plansError } = await query;

    if (plansError) throw plansError;

    res.status(200).json(plans);

  } catch (error) {
    console.error("Error fetching account development plans:", error);
    res.status(500).json({ error: "Server error" });
  }
}
