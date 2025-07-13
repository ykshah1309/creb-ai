// pages/api/lease/generate.ts

import type { NextApiRequest, NextApiResponse } from "next";
import PDFKit from "pdfkit";
import getStream from "get-stream";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!    // your service_role key
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { matchId } = req.body as { matchId?: string };
  // you can grab senderId from your auth cookie/session, but for now:
  const senderId = req.body.senderId as string | undefined;

  if (!matchId || !senderId) {
    return res.status(400).json({ error: "Missing matchId or senderId" });
  }

  try {
    // 1) Generate a simple PDF in memory
    const doc = new PDFKit();
    doc.text("COMMERCIAL LEASE AGREEMENT", { align: "center", underline: true });
    doc.moveDown();
    doc.text(`Match ID: ${matchId}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text("This is a placeholder 12-month commercial lease between Landlord and Tenant.");
    doc.moveDown();
    doc.text("Terms:");
    doc.list([
      "Term: 12 months",
      "Rent: $X per month",
      "Security Deposit: $X",
      "Lease Start Date: ...",
      "Lease End Date: ...",
    ]);
    doc.moveDown();
    doc.text("Both parties agree to the above terms.", { align: "left" });
    doc.end();

    // collect PDF into a Buffer
    const pdfBuffer = Buffer.from(await getStream.arrayBuffer(doc));

    // 2) Upload into your `leases` bucket
    const path = `${matchId}/lease.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("leases")
      .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (upErr) throw upErr;

    // 3) Get its public URL
    const { data: urlData, error: urlErr } = supabaseAdmin.storage
      .from("leases")
      .getPublicUrl(path);
    if (urlErr || !urlData.publicUrl) throw urlErr || new Error("Could not fetch public URL");

    const leaseUrl = urlData.publicUrl;

    // 4) Save it into matches.contract_url
    const { error: dbErr } = await supabaseAdmin
      .from("matches")
      .update({ contract_url: leaseUrl })
      .eq("id", matchId);
    if (dbErr) throw dbErr;

    // 5) Insert a chat message so both users see the link
    await supabaseAdmin.from("messages").insert({
      match_id: matchId,
      sender: senderId,
      content: `📄 Lease Agreement: ${leaseUrl}`,
    });

    return res.status(200).json({ url: leaseUrl });
  } catch (error: any) {
    console.error("Lease generation error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}