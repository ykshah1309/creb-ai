import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { matchId, leaseText } = req.body;
  if (!matchId || !leaseText) return res.status(400).json({ error: "Missing matchId or leaseText" });

  // regenerate PDF from leaseText
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const fontSize = 12;

  // rudimentary text layout
  leaseText.split("\n").forEach((line, i) => {
    page.drawText(line, { x: 50, y: height - (i + 2) * fontSize, size: fontSize, font, color: rgb(0,0,0) });
  });

  const pdfBytes = await pdfDoc.save();
  const path = `leases/${matchId}.pdf`;

  // overwrite existing PDF
  await supabaseAdmin.storage
    .from("property-images")
    .upload(path, pdfBytes, { upsert: true, contentType: "application/pdf" });

  const { data: urlData } = supabaseAdmin.storage
    .from("property-images")
    .getPublicUrl(path);

  // update both URL and lease_text
  await supabaseAdmin.from("matches")
    .update({ contract_url: urlData.publicUrl, lease_text: leaseText })
    .eq("id", matchId);

  return res.status(200).json({ url: urlData.publicUrl });
}