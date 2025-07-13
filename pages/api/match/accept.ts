// pages/api/match/accept.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { match_id } = req.body;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  // only the `to_user` may accept
  const { data, error } = await supabase
    .from("matches")
    .update({ status: "accepted" })
    .eq("id", match_id)
    .eq("to_user", user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ match: data });
}