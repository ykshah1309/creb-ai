// pages/api/lease/generate.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Admin client (service_role key must be set in env)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOCK_LEASE_TEMPLATE = `
COMMERCIAL LEASE AGREEMENT

Tenant: {{tenantName}}
Landlord: {{landlordName}}
Property: {{propertyTitle}}, {{propertyLocation}}

Term: 12 months
Rent: ${{monthly_rent}} per month

[... more static boilerplate ...]

By signing below, both parties agree to the above terms.

Landlord Signature: ______________________
Tenant Signature: ______________________
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { matchId } = req.body as { matchId: string };
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }

    // 1) Load match
    const { data: match, error: matchErr } = await supabaseAdmin
      .from("matches")
      .select("id, from_user, to_user, property_id")
      .eq("id", matchId)
      .single();
    if (matchErr || !match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // 2) Load related property + users
    const [{ data: prop }, { data: landlord }, { data: tenant }] =
      await Promise.all([
        supabaseAdmin
          .from("properties")
          .select("title, location, monthly_rent")
          .eq("id", match.property_id)
          .single(),
        supabaseAdmin
          .from("users")
          .select("name")
          .eq("id", match.to_user)
          .single(),
        supabaseAdmin
          .from("users")
          .select("name")
          .eq("id", match.from_user)
          .single(),
      ]);

    if (!prop || !landlord || !tenant) {
      return res.status(500).json({ error: "Related data missing" });
    }

    // 3) Populate template
    const leaseText = MOCK_LEASE_TEMPLATE
      .replace("{{tenantName}}", tenant.name)
      .replace("{{landlordName}}", landlord.name)
      .replace("{{propertyTitle}}", prop.title)
      .replace("{{propertyLocation}}", prop.location)
      .replace("{{monthly_rent}}", prop.monthly_rent.toString());

    // 4) Save lease_text on match
    const { error: updErr } = await supabaseAdmin
      .from("matches")
      .update({ lease_text: leaseText })
      .eq("id", matchId);
    if (updErr) {
      return res.status(500).json({ error: "Could not save lease" });
    }

    // 5) Insert a system message
    await supabaseAdmin.from("messages").insert({
      match_id: matchId,
      sender: match.to_user, // landlord
      content: "🔔 A lease has been generated and sent to you.",
    });

    return res.status(200).json({ lease: leaseText });
  } catch (e) {
    console.error("Lease generation error:", e);
    return res.status(500).json({ error: "Lease generation failed" });
  }
}