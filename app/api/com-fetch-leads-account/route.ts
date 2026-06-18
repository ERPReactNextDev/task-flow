import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const Xchire_databaseUrl = process.env.TASKFLOW_DB_URL;
if (!Xchire_databaseUrl) {
  throw new Error("TASKFLOW_DB_URL is not set in the environment variables.");
}
const Xchire_sql = neon(Xchire_databaseUrl);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const referenceId = url.searchParams.get("referenceid");

    if (!referenceId) {
      return NextResponse.json(
        { success: false, error: "Missing reference ID." },
        { status: 400 }
      );
    }

    // Fetch inactive accounts — these are potential leads to re-engage
    const data = await Xchire_sql`
      SELECT * FROM accounts
      WHERE referenceid = ${referenceId}
      AND LOWER(status) = 'inactive'
      ORDER BY date_updated DESC;
    `;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching leads accounts:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch leads accounts." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
