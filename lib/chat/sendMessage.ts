import { supabase } from "@/lib/supabaseClient";

export async function sendMessage({ matchId, senderId, content }: {
  matchId: string;
  senderId: string;
  content: string;
}) {
  const { error } = await supabase.from("messages").insert({
    match_id: matchId,
    sender: senderId,
    content,
  });

  if (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
}