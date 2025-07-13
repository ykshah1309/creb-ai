// components/ChatbotUI.tsx

import { useEffect, useState, useRef } from "react";
import { Box, Input, IconButton, VStack, HStack, Spinner } from "@chakra-ui/react";
import { ArrowUpIcon } from "@chakra-ui/icons";
import { supabase } from "@/lib/supabaseClient";

type Message = { role: "user" | "assistant"; text: string };

export default function ChatbotUI({ user, listings, matches, leases }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // DEBUG: See what user is passed in
  useEffect(() => {
    console.log("ChatbotUI user prop:", user);
  }, [user]);

  // Load latest chat history for this user (on mount)
  useEffect(() => {
    if (!user) {
      setMessages([
        {
          role: "assistant",
          text: "Please log in to chat with CREB.Ai assistant.",
        },
      ]);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("ai_chat_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        console.log("Loaded ai_chat_history:", { data, error });

        if (data && data.messages) {
          setMessages(data.messages);
          setHistoryId(data.id);
        } else {
          setMessages([
            {
              role: "assistant",
              text: "Hi! I’m your CREB.Ai assistant. Ask me anything about your listings, matches, leases, or property recommendations.",
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
        setMessages([
          {
            role: "assistant",
            text: "Hi! I’m your CREB.Ai assistant. Ask me anything about your listings, matches, leases, or property recommendations.",
          },
        ]);
      }
    })();
  }, [user]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save chat history to Supabase
  const saveHistory = async (updatedMessages: Message[]) => {
    if (!user) return;
    try {
      if (historyId) {
        const { error } = await supabase
          .from("ai_chat_history")
          .update({ messages: updatedMessages })
          .eq("id", historyId);
        if (error) console.error("Supabase update error:", error);
      } else {
        const { data, error } = await supabase
          .from("ai_chat_history")
          .insert({ user_id: user.id, messages: updatedMessages })
          .select()
          .single();
        if (error) console.error("Supabase insert error:", error);
        if (data) setHistoryId(data.id);
      }
    } catch (err) {
      console.error("saveHistory exception:", err);
    }
  };

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || !messages || sending) return;
    setSending(true);
    const newMessage = { role: "user" as const, text: input.trim() };
    const nextMessages = [...messages, newMessage];
    setMessages(nextMessages);
    setInput("");
    setMessages((prev) => [...(prev || []), { role: "assistant", text: "..." }]);

    try {
      const res = await fetch("/api/creb-ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          user,
          listings,
          matches,
          leases,
        }),
      });
      const data = await res.json();
      const aiText =
        data.text ||
        "Sorry, I couldn't generate a response. Please try again later.";
      const finalMessages = [
        ...nextMessages,
        { role: "assistant" as const, text: aiText },
      ];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } catch (err) {
      console.error("Error sending message to AI agent:", err);
      setMessages((prev) =>
        (prev || []).slice(0, -1).concat({
          role: "assistant" as const,
          text: "Sorry, the AI agent is currently unavailable.",
        })
      );
    }
    setSending(false);
  };

  if (!messages)
    return (
      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="lg" />
      </Box>
    );

  return (
    <VStack align="stretch" spacing={3} height="100%" p={3}>
      <Box flex="1" overflowY="auto" pb={3}>
        {messages.map((msg, i) => (
          <Box key={i} textAlign={msg.role === "user" ? "right" : "left"}>
            <Box
              as="span"
              display="inline-block"
              bg={msg.role === "user" ? "teal.400" : "gray.200"}
              color={msg.role === "user" ? "white" : "gray.700"}
              px={4}
              py={2}
              borderRadius="lg"
              my={1}
              maxWidth="80%"
              fontSize="md"
              whiteSpace="pre-line"
            >
              {msg.text}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <HStack>
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !sending) handleSend();
          }}
          flex="1"
          isDisabled={sending || !user}
        />
        <IconButton
          aria-label="Send"
          icon={<ArrowUpIcon />}
          colorScheme="teal"
          onClick={handleSend}
          isDisabled={sending || !input.trim() || !user}
        />
      </HStack>
    </VStack>
  );
}