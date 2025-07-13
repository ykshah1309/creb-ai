// pages/api/lease/generate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { matchId, senderId } = req.body;
  if (!matchId || !senderId) {
    return res.status(400).json({ error: "Missing matchId or senderId" });
  }

  try {
    // 1) Fetch match
    const { data: match, error: mErr } = await supabaseAdmin
      .from("matches")
      .select("id, property_id, from_user, to_user")
      .eq("id", matchId)
      .single();
    if (mErr || !match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // 2) Build lease text template
    const leaseText = [
      "Commercial Lease Agreement",
      "",
      `Match ID: ${match.id}`,
      "Term: 12 months",
      "Rent: $__________ per month",
      "",
      "Landlord Signature: ____________________",
      "Tenant Signature: ____________________",
    ].join("\n");

    // 3) Render PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();
    const fontSize = 12;

    leaseText.split("\n").forEach((line, i) => {
      page.drawText(line, {
        x: 50,
        y: height - (i + 2) * fontSize,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });

    const pdfBytes = await pdfDoc.save();

    // 4) Upload PDF to storage
    const filePath = `leases/${matchId}.pdf`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("property-images")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabaseAdmin.storage
      .from("property-images")
      .getPublicUrl(filePath);

    // 5) Update match row (contract_url + lease_text)
    await supabaseAdmin
      .from("matches")
      .update({ contract_url: urlData.publicUrl, lease_text: leaseText })
      .eq("id", matchId);

    // 6) Insert chat message
    await supabaseAdmin.from("messages").insert({
      match_id: matchId,
      sender: senderId,
      content: `📄 Lease document sent: ${urlData.publicUrl}`,
    });

    res.status(200).json({ url: urlData.publicUrl });
  } catch (error: any) {
    console.error("Lease generation error:", error);
    res.status(500).json({ error: error.message });
  }
}