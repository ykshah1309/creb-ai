// pages/matches.tsx

import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Input,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import SignContractModal from "@/components/SignContractModal";

type Property = {
  id: string;
  title: string;
  image_url: string | null;
  location: string;
  price: number;
  description: string;
  owner_id: string;
};

type Match = {
  id: string;
  from_user: string;
  to_user: string;
  property_id: string;
  status: "pending" | "accepted" | "rejected";
  lease_text?: string;
  contract_url?: string;
  signature_url?: string;
};

type Message = {
  id: string;
  match_id: string;
  sender: string;
  content: string;
  created_at: string;
};

export default function MatchesPage() {
  const { user, loading: userLoading } = useUser();
  const toast = useToast();
  const router = useRouter();
  const { matchId } = router.query as { matchId?: string };

  const [incoming, setIncoming] = useState<Match[]>([]);
  const [accepted, setAccepted] = useState<Match[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [generatingLease, setGeneratingLease] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** Fetch incoming likes & accepted matches + load properties **/
  const fetchMatches = async () => {
    if (!user) return;
    setLoading(true);

    // incoming pending
    const { data: inc } = await supabase
      .from<Match>("matches")
      .select("*")
      .eq("to_user", user.id)
      .eq("status", "pending");

    // accepted where user is either side
    const { data: acc } = await supabase
      .from<Match>("matches")
      .select("*")
      .or(
        `and(status.eq.accepted,from_user.eq.${user.id}),and(status.eq.accepted,to_user.eq.${user.id})`
      );

    setIncoming(inc || []);
    setAccepted(acc || []);

    // load all involved properties
    const ids = [
      ...(inc || []).map((m) => m.property_id),
      ...(acc || []).map((m) => m.property_id),
    ];
    const unique = Array.from(new Set(ids));
    if (unique.length) {
      const { data: props } = await supabase
        .from<Property>("properties")
        .select("*")
        .in("id", unique);
      const map: Record<string, Property> = {};
      props?.forEach((p) => (map[p.id] = p));
      setProperties(map);
    }

    setLoading(false);
  };

  /** Fetch chat history **/
  const fetchMessages = async (mid: string) => {
    const { data } = await supabase
      .from<Message>("messages")
      .select("*")
      .eq("match_id", mid)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  /** Real‐time subscription **/
  useEffect(() => {
    if (!selectedMatch) return;
    const channel = supabase
      .channel(`chat:${selectedMatch.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${selectedMatch.id}`,
        },
        (payload) => {
          setMessages((m) => [...m, payload.new as Message]);
        }
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [selectedMatch]);

  /** Initial load **/
  useEffect(() => {
    if (user) fetchMatches();
  }, [user]);

  /** Auto‐select if query param **/
  useEffect(() => {
    if (matchId && accepted.length) {
      const m = accepted.find((x) => x.id === matchId);
      if (m) {
        selectChat(m);
      }
    }
  }, [matchId, accepted]);

  const selectChat = (m: Match) => {
    setSelectedMatch(m);
    router.replace({ query: { matchId: m.id } }, undefined, { shallow: true });
    fetchMessages(m.id);
  };

  const handleSend = async () => {
    if (!user || !selectedMatch || !newMessage.trim()) return;
    await supabase.from("messages").insert({
      match_id: selectedMatch.id,
      sender: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  /** Call our mock lease endpoint **/
  const generateLease = async () => {
    if (!selectedMatch) return;
    setGeneratingLease(true);
    const res = await fetch("/api/lease/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: selectedMatch.id }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast({
        title: "Error generating lease",
        description: body.error,
        status: "error",
        duration: 5000,
      });
    } else {
      toast({
        title: "Lease sent!",
        status: "success",
        duration: 3000,
      });
      // reload matches so that lease_text appears if you want to display it
      fetchMatches();
    }
    setGeneratingLease(false);
    setLeaseModalOpen(false);
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout>
        <Box textAlign="center" mt={20}>
          <Spinner size="xl" />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Flex h="100%" minH="80vh">
        {/* ← Left Sidebar */}
        <Box
          w="280px"
          borderRight="1px solid"
          borderColor="gray.200"
          overflowY="auto"
        >
          <VStack p={4} align="stretch" spacing={6}>
            <Heading size="sm">Incoming Likes</Heading>
            {incoming.length ? (
              incoming.map((m) => (
                <HStack key={m.id} spacing={2}>
                  <Button
                    size="xs"
                    colorScheme="green"
                    onClick={async () => {
                      await supabase
                        .from("matches")
                        .update({ status: "accepted" })
                        .eq("id", m.id);
                      fetchMatches();
                    }}
                  >
                    ✓
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="outline"
                    onClick={async () => {
                      await supabase
                        .from("matches")
                        .update({ status: "rejected" })
                        .eq("id", m.id);
                      fetchMatches();
                    }}
                  >
                    ✕
                  </Button>
                  <NextLink href={`/property/${m.property_id}`} passHref>
                    <Text as="a" noOfLines={1} flex="1">
                      {properties[m.property_id]?.title || "—"}
                    </Text>
                  </NextLink>
                </HStack>
              ))
            ) : (
              <Text fontSize="sm" color="gray.500">
                No new likes
              </Text>
            )}

            <Heading size="sm" pt={4}>
              Active Chats
            </Heading>
            {accepted.length ? (
              accepted.map((m) => (
                <Box
                  key={m.id}
                  p={2}
                  borderRadius="md"
                  bg={
                    selectedMatch?.id === m.id
                      ? useColorModeValue("teal.50", "teal.800")
                      : undefined
                  }
                  cursor="pointer"
                  onClick={() => selectChat(m)}
                >
                  {properties[m.property_id]?.title || "—"}
                </Box>
              ))
            ) : (
              <Text fontSize="sm" color="gray.500">
                No active chats
              </Text>
            )}
          </VStack>
        </Box>

        {/* → Main Chat & Lease Panel */}
        <Box flex="1" p={6} display="flex" flexDir="column">
          {selectedMatch ? (
            <>
              <Heading size="md" mb={4}>
                Chat — {properties[selectedMatch.property_id]?.title}
              </Heading>
              <Box flex="1" overflowY="auto" mb={4}>
                {messages.map((msg) => (
                  <Box
                    key={msg.id}
                    textAlign={msg.sender === user!.id ? "right" : "left"}
                    mb={2}
                  >
                    <Text
                      as="span"
                      bg={
                        msg.sender === user!.id
                          ? "teal.500"
                          : useColorModeValue("gray.200", "gray.700")
                      }
                      color={msg.sender === user!.id ? "white" : undefined}
                      px={3}
                      py={1}
                      borderRadius="md"
                      display="inline-block"
                    >
                      {msg.content}
                    </Text>
                  </Box>
                ))}
                <div ref={chatEndRef} />
              </Box>

              <HStack mb={4}>
                <Input
                  placeholder="Type your message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button colorScheme="teal" onClick={handleSend}>
                  Send
                </Button>
              </HStack>

              {/* Owner: Generate Lease */}
              {user!.id === selectedMatch.to_user && (
                <Button
                  colorScheme="blue"
                  onClick={() => setLeaseModalOpen(true)}
                >
                  Generate & Send Lease
                </Button>
              )}

              {/* Renter: Sign Lease */}
              {selectedMatch.lease_text &&
                user!.id !== selectedMatch.to_user && (
                  <Button
                    colorScheme="teal"
                    onClick={() => setSignModalOpen(true)}
                  >
                    Review & Sign Lease
                  </Button>
                )}
            </>
          ) : (
            <Text>Select an incoming like or chat on the left to begin.</Text>
          )}
        </Box>
      </Flex>

      {/* Generate Lease Confirmation */}
      <Modal
        isOpen={leaseModalOpen}
        onClose={() => setLeaseModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate & Send Lease</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              This will create a standard commercial lease and send it to the
              renter for review.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              isLoading={generatingLease}
              onClick={generateLease}
            >
              Generate & Send
            </Button>
            <Button onClick={() => setLeaseModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Sign Contract Modal */}
      {signModalOpen && selectedMatch && (
        <SignContractModal
          isOpen={signModalOpen}
          matchId={selectedMatch.id}
          onClose={() => {
            setSignModalOpen(false);
            fetchMatches();
          }}
        />
      )}
    </DashboardLayout>
  );
}