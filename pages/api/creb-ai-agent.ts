// pages/api/creb-ai-agent.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LLM_BASE_URL = "http://127.0.0.1:1234/v1/chat/completions";
const MODEL = "qwen/qwen2.5-vl-7b"; // Or whichever model is loaded

// Optional: Simple FAQ mapping (add/expand as you like)
const FAQS: Record<string, string> = {
  "how do i reset my password": "To reset your password, go to the login page and click 'Forgot Password'. You'll receive an email to set a new password.",
  "how do i add a property": "To add a property, click 'Post a Property' on your dashboard and fill in the required details.",
  "what is creb.ai": "CREB.Ai is a commercial real estate platform that uses AI to help you manage properties, matches, leases, and more.",
  "how do i contact support": "To contact support, email support@creb.ai or use the 'Help' option in your dashboard.",
};

function checkFAQ(userInput: string): string | null {
  const normalized = userInput.trim().toLowerCase();
  for (const q in FAQS) {
    if (normalized.includes(q)) return FAQS[q];
  }
  return null;
}

// Helper: Save or update chat history
async function saveHistory(userId: string, newMessages: { role: string; text: string }[]) {
  const { data: existing } = await supabase
    .from("ai_chat_history")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing?.id) {
    await supabase
      .from("ai_chat_history")
      .update({ messages: newMessages })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("ai_chat_history")
      .insert({ user_id: userId, messages: newMessages });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { messages, user: userProp } = req.body;

  if (!userProp?.id) {
    return res.status(401).json({ text: "You must be logged in to use CREB.Ai Assistant." });
  }

  // Check if FAQ
  const userMsg = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
  const faqAnswer = checkFAQ(userMsg);
  if (faqAnswer) {
    // Save chat with FAQ response to history
    await saveHistory(userProp.id, [
      ...(messages || []),
      { role: "assistant", text: faqAnswer },
    ]);
    return res.json({ text: faqAnswer });
  }

  // Fetch user’s data from Supabase
  const { data: listings } = await supabase
    .from("properties")
    .select("id, title, location, price, monthly_rent, owner_id")
    .eq("owner_id", userProp.id);

  const { data: matches } = await supabase
    .from("matches")
    .select("id, status, property_id, from_user, to_user, created_at, contract_url")
    .or(`from_user.eq.${userProp.id},to_user.eq.${userProp.id}`);

  const { data: leases } = await supabase
    .from("matches")
    .select("id, property_id, status, created_at, contract_url, lease_text")
    .or(`from_user.eq.${userProp.id},to_user.eq.${userProp.id}`)
    .not("lease_text", "is", null);

  // Summaries
  const listingsSummary = listings && listings.length
    ? listings.map(l => `• ${l.title} (${l.location}) — $${l.price}/year`).join("\n")
    : "No properties listed.";

  const matchesSummary = matches && matches.length
    ? matches.map(m => `• Property ${m.property_id}, status: ${m.status}`).join("\n")
    : "No matches found.";

  const leasesSummary = leases && leases.length
    ? leases.map(l => `• Lease for property ${l.property_id}, contract: ${l.contract_url || "none"}`).join("\n")
    : "No active leases.";

  // Lease reminders: any lease ending within the next 30 days?
  let leasesEndingSoon = "";
  if (leases && leases.length) {
    const soon = leases.filter(l => {
      const match = l.lease_text?.match(/end_date\s*:\s*(\d{4}-\d{2}-\d{2})/);
      if (!match) return false;
      const endDate = new Date(match[1]);
      const now = new Date();
      const in30days = new Date();
      in30days.setDate(now.getDate() + 30);
      return endDate >= now && endDate <= in30days;
    });
    if (soon.length)
      leasesEndingSoon =
        "Leases ending soon:\n" +
        soon
          .map(l => `• Lease for property ${l.property_id}, ends on ${l.lease_text.match(/end_date\s*:\s*(\d{4}-\d{2}-\d{2})/)?.[1]}`)
          .join("\n");
  }

  // Compose system prompt for LLM
  const systemPrompt = `
You are CREB.Ai, a commercial real estate assistant. 
Always use the following user data to answer questions:
# User Listings:
${listingsSummary}

# User Matches:
${matchesSummary}

# User Leases:
${leasesSummary}

${leasesEndingSoon ? leasesEndingSoon : ""}
  `.trim();

  // Build OpenAI-style chat messages
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: any) => ({
      role: m.role,
      content: m.text,
    })),
  ];

  // LM Studio OpenAI-style payload
  const payload = {
    model: MODEL,
    messages: chatMessages,
    temperature: 0.6,
    max_tokens: 512,
    stream: false,
  };

  try {
    const resp = await fetch(LLM_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    // Save chat with LLM response to history
    await saveHistory(userProp.id, [
      ...(messages || []),
      { role: "assistant", text: aiText },
    ]);

    res.json({ text: aiText });
  } catch (err: any) {
    console.error("LLM API error:", err);
    res.status(500).json({
      text: "Sorry, there was an error talking to the AI agent.",
    });
  }
}