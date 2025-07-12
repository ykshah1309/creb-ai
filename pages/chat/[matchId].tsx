import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { sendMessage } from "@/lib/chat/sendMessage";
import { subscribeToMessages } from "@/lib/chat/subscribeToMessages";
import { supabase } from "@/lib/supabaseClient";

export default function ChatPage() {
  const user = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const matchId = "<HARDCODED_MATCH_ID>"; // Replace with real match id via query or props

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    }

    loadMessages();

    const unsubscribe = subscribeToMessages(matchId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      unsubscribe();
    };
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    await sendMessage({
      matchId,
      senderId: user?.id!,
      content: input,
    });

    setInput("");
  };

  return (
    <Flex direction="column" h="100vh">
      <Box flex="1" p={4} overflowY="auto">
        <VStack spacing={3} align="stretch">
          {messages.map((msg) => (
            <Box
              key={msg.id}
              alignSelf={msg.sender === user?.id ? "flex-end" : "flex-start"}
              bg={msg.sender === user?.id ? "teal.500" : "gray.200"}
              color={msg.sender === user?.id ? "white" : "black"}
              px={4}
              py={2}
              borderRadius="md"
              maxW="70%"
            >
              <Text>{msg.content}</Text>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Flex p={4} borderTop="1px solid #e2e8f0">
        <Input
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button ml={2} onClick={handleSend} colorScheme="teal">
          Send
        </Button>
      </Flex>
    </Flex>
  );
}