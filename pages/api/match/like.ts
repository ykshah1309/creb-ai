// pages/api/match/like.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { from_user, to_user, property_id } = req.body;

  if (!from_user || !to_user || !property_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const { data, error } = await supabase.from("matches").insert([
    {
      from_user,
      to_user,
      property_id,
      status: "pending",
    },
  ]);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ message: "Match request sent", data });
}