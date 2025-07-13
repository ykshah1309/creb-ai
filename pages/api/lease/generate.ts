// pages/api/lease/generate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"; // or your PDF lib of choice

// Supabase admin client—make sure SUPABASE_SERVICE_ROLE_KEY is set in your .env
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
    // 1) Load the match + property + users
    const { data: match, error: mErr } = await supabaseAdmin
      .from("matches")
      .select("id, property_id, from_user, to_user")
      .eq("id", matchId)
      .single();
    if (mErr || !match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // 2) Draft a simple one-page PDF lease
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    page.drawText(`Commercial Lease Agreement`, {
      x: 50,
      y: height - 4 * fontSize,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Match ID: ${match.id}`, { x: 50, y: height - 6 * fontSize, size: fontSize, font });
    page.drawText(`Term: 12 months`, { x: 50, y: height - 7 * fontSize, size: fontSize, font });
    page.drawText(`Rent: $____________ per month`, { x: 50, y: height - 8 * fontSize, size: fontSize, font });
    page.drawText(`\nLandlord Signature: ____________________`, {
      x: 50,
      y: height - 10 * fontSize,
      size: fontSize,
      font,
    });
    page.drawText(`\nTenant Signature: ____________________`, {
      x: 50,
      y: height - 12 * fontSize,
      size: fontSize,
      font,
    });

    const pdfBytes = await pdfDoc.save();

    // 3) Upload the PDF to storage
    const filePath = `leases/${matchId}.pdf`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("property-images")      // or your "leases" bucket
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabaseAdmin.storage
      .from("property-images")
      .getPublicUrl(filePath);

    // 4) Update the match row with the contract_url
    await supabaseAdmin
      .from("matches")
      .update({ contract_url: urlData.publicUrl })
      .eq("id", matchId);

    // 5) Insert a chat message so it shows up in the chat log
    await supabaseAdmin.from("messages").insert({
      match_id: matchId,
      sender: senderId,
      content: `📄 Lease document sent: ${urlData.publicUrl}`,
    });

    return res.status(200).json({ url: urlData.publicUrl });
  } catch (error: any) {
    console.error("Lease generation error:", error);
    return res.status(500).json({ error: error.message });
  }
}