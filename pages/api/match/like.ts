// pages/api/match/like.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { property_id } = req.body;
  // 1) Ensure user is signed in
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  // 2) Load the property so we know who owns it
  const { data: prop, error: propErr } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", property_id)
    .single();

  if (propErr || !prop) {
    return res.status(404).json({ error: "Property not found" });
  }

  // 3) Insert the match with both from_user and to_user
  const { error: matchErr } = await supabase
    .from("matches")
    .insert({
      property_id,
      from_user: user.id,
      to_user: prop.owner_id,
      status: "pending",
    });

  if (matchErr) {
    return res.status(500).json({ error: matchErr.message });
  }

  return res.status(200).json({ message: "Like sent" });
}