import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "DELETE") {
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const planId = req.query.id as string;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("account_development_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    // Fetch main plan (all data is in this single table now)
    const { data: plan, error: planError } = await supabase
      .from("account_development_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.status(200).json(plan);

  } catch (error) {
    console.error("Error with account development plan:", error);
    res.status(500).json({ error: "Server error" });
  }
}
