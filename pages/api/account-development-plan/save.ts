import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "PUT") {
    res.setHeader("Allow", ["POST", "PUT"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    console.log("req.body:", JSON.stringify(req.body, null, 2));
    const {
      planId,
      user_id,
      referenceid,
      tsm,
      manager,
      customer_name,
      industry,
      account_manager,
      status,
      projects,
      product_offering,
      account_summary,
      key_contacts,
      business_objectives,
      growth_opportunities,
      action_items,
      project_pipeline,
      competitors,
      risks,
      kpis,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Step 1: Create or update main plan
    let planIdToUse: string;
    if (req.method === "POST" || !planId) {
      const { data: newPlan, error: planError } = await supabase
        .from("account_development_plans")
        .insert([{
          user_id: parseInt(user_id),
          referenceid,
          tsm,
          manager,
          customer_name,
          industry,
          account_manager,
          status,
          projects,
          product_offering,
          account_summary,
          key_contacts,
          business_objectives,
          growth_opportunities,
          action_items,
          project_pipeline,
          competitors,
          risks,
          kpis,
        }])
        .select("id")
        .single();

      if (planError) throw planError;
      planIdToUse = newPlan.id;
    } else {
      const { data: updatedPlan, error: updateError } = await supabase
        .from("account_development_plans")
        .update({
          referenceid,
          tsm,
          manager,
          customer_name,
          industry,
          account_manager,
          status,
          projects,
          product_offering,
          account_summary,
          key_contacts,
          business_objectives,
          growth_opportunities,
          action_items,
          project_pipeline,
          competitors,
          risks,
          kpis,
          updated_at: new Date().toISOString(),
        })
        .eq("id", planId)
        .select("id")
        .single();

      if (updateError) throw updateError;
      planIdToUse = updatedPlan.id;
    }

    res.status(200).json({
      success: true,
      planId: planIdToUse,
      message: req.method === "POST" ? "Plan created successfully" : "Plan updated successfully",
    });

  } catch (error) {
    console.error("Error saving account development plan:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
}
