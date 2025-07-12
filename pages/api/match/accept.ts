// pages/api/match/accept.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { match_id } = req.body;

  const { error } = await supabase
    .from("matches")
    .update({ status: "accepted" })
    .eq("id", match_id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: "Match accepted" });
}