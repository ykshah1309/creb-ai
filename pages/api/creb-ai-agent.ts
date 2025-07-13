// pages/api/creb-ai-agent.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Use environment variables for keys!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role Key for secure server queries
);

const LLM_BASE_URL = "http://127.0.0.1:1234/v1/chat/completions";
const MODEL = "qwen/qwen2.5-vl-7b"; // as shown in /v1/models

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { messages, user, listings, matches, leases } = req.body;

  // 1. ANALYTICS & REMINDERS QUERIES

  // a) Most common property type for this user (if seller)
  let topType: string | null = null;
  if (user?.id) {
    const { data: typeData } = await supabase
      .from("properties")
      .select("type, count:type")
      .eq("owner_id", user.id)
      .group("type")
      .order("count", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (typeData && typeData.type) topType = typeData.type;
  }

  // b) Upcoming lease expirations (next 30 days)
  let expiringLeases: any[] = [];
  if (user?.id) {
    const { data } = await supabase
      .from("leases")
      .select("*")
      .eq("user_id", user.id)
      .gte("end_date", new Date().toISOString())
      .lte("end_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("end_date", { ascending: true });
    expiringLeases = data ?? [];
  }

  // c) Rent due in next 7 days (landlord side)
  let rentReminders: any[] = [];
  if (user?.id) {
    const { data } = await supabase
      .from("leases")
      .select("*")
      .eq("user_id", user.id)
      .gte("next_rent_due_date", new Date().toISOString())
      .lte("next_rent_due_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "active");
    rentReminders = data ?? [];
  }

  // 2. ENHANCED SYSTEM PROMPT
  const systemPrompt = `
You are CREB.Ai, a commercial real estate AI assistant.
- Help users with customer support and doubts about listings.
- Track matches for user's properties and notify on new matches.
- Remind user if a lease is about to end, or about upcoming rent payments if user is a landlord.
- Analyze what type of buyers this user prefers (if user is a seller) or what type of properties (if user is a buyer), and recommend accordingly.
- Use the following context for smarter recommendations and reminders.

# User analytics & reminders (for LLM only, do not display as-is to user):
Most common property type user lists: ${topType || "Unknown"}
Leases expiring in next 30 days: ${expiringLeases.length}
Leases with rent due in next 7 days: ${rentReminders.length}
---

Always give practical, friendly, context-aware advice based on the user’s data.
If reminders are relevant, mention them politely in your answers.
`;

  // 3. Compose full context for the LLM
  const llmMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((msg: any) => ({
      role: msg.role,
      content: msg.text,
    })),
    {
      role: "user",
      content: `
User info: ${JSON.stringify(user)}
Listings: ${JSON.stringify(listings)}
Matches: ${JSON.stringify(matches)}
Leases: ${JSON.stringify(leases)}
Upcoming lease expirations: ${JSON.stringify(expiringLeases)}
Upcoming rent reminders: ${JSON.stringify(rentReminders)}
Most common property type: ${topType || "Unknown"}
    `,
    },
  ];

  const payload = {
    model: MODEL,
    messages: llmMessages,
    temperature: 0.4,
    max_tokens: 800,
    stream: false,
  };

  try {
    const resp = await fetch(LLM_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`LLM error: ${errorText}`);
    }
    const data = await resp.json();
    const aiText =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.delta?.content ||
      "Sorry, I couldn't generate a response.";

    res.json({ text: aiText });
  } catch (err: any) {
    console.error("LLM API error:", err);
    res.status(500).json({
      text: "Sorry, there was an error talking to the AI agent.",
    });
  }
}