// pages/api/match/like.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { property_id } = req.body;
  // get currently logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  // look up the owner of that property
  const { data: prop, error: propErr } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", property_id)
    .single();
  if (propErr || !prop) return res.status(500).json({ error: propErr?.message });

  // insert a pending match
  const { data, error } = await supabase
    .from("matches")
    .insert({
      from_user: user.id,
      to_user: prop.owner_id,
      property_id,
      status: "pending",
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ match: data });
}