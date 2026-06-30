import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { logAuditTrailApp } from "@/lib/auditTrail";

const Xchire_databaseUrl = process.env.TASKFLOW_DB_URL;
if (!Xchire_databaseUrl) {
  throw new Error("TASKFLOW_DB_URL is not set in the environment variables.");
}
const Xchire_sql = neon(Xchire_databaseUrl);

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, referenceid, tsm, manager } = body;

    if (!id || !referenceid || !tsm || !manager) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: id, referenceid, tsm, or manager",
        },
        { status: 400 }
      );
    }

    const updated = await Xchire_sql`
      UPDATE accounts
      SET
        referenceid = ${referenceid},
        manager     = ${manager},
        tsm         = ${tsm}
      WHERE id = ${id}
      RETURNING id, account_reference_number, referenceid, manager, tsm;
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found or no changes applied." },
        { status: 404 }
      );
    }

    await logAuditTrailApp(
      req,
      "update",
      "company ticket assignment",
      id,
      updated[0].account_reference_number ?? String(id),
      `Updated ticket assignment for account`,
      { manager, tsm }
    );

    return NextResponse.json({ success: true, data: updated[0] }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating account referenceid and manager:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update account referenceid and manager.",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
