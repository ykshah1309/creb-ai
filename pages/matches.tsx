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

type Match = {
  id: string;
  from_user: string;
  to_user: string;
  property_id: string;
  status: "pending" | "accepted" | "rejected";
  contract_url?: string;
  signature_url?: string;
};

type Property = {
  id: string;
  title: string;
  image_url: string | null;
  location: string;
  price: number;
  description: string;
  owner_id: string;
};

type Message = {
  id: string;
  match_id: string;
  sender: string;
  content: string;
  created_at: string;
};

type User = {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string;
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

  // Load incoming & accepted matches + property data
  async function fetchMatches() {
    if (!user) return;
    setLoading(true);

    const [{ data: inc }, { data: acc }] = await Promise.all([
      supabase.from<Match>("matches").select("*")
        .eq("to_user", user.id)
        .eq("status", "pending"),
      supabase.from<Match>("matches").select("*")
        .or(`and(status.eq.accepted,from_user.eq.${user.id}),and(status.eq.accepted,to_user.eq.${user.id})`),
    ]);

    setIncoming(inc || []);
    setAccepted(acc || []);

    const ids = Array.from(new Set([
      ...(inc||[]).map(m => m.property_id),
      ...(acc||[]).map(m => m.property_id)
    ]));
    if (ids.length) {
      const { data: props } = await supabase
        .from<Property>("properties")
        .select("*")
        .in("id", ids);
      const map: Record<string, Property> = {};
      props?.forEach(p => map[p.id] = p);
      setProperties(map);
    }

    setLoading(false);
  }

  // Fetch chat messages for a match
  async function fetchMessages(mid: string) {
    const { data } = await supabase
      .from<Message>("messages")
      .select("*")
      .eq("match_id", mid)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }

  // Real-time message subscription
  useEffect(() => {
    if (!selectedMatch) return;
    const ch = supabase
      .channel(`chat:${selectedMatch.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `match_id=eq.${selectedMatch.id}`
      }, (payload) => {
        setMessages(msgs => [...msgs, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedMatch]);

  // Initial load
  useEffect(() => { if (user) fetchMatches(); }, [user]);

  // Auto-select via URL
  useEffect(() => {
    if (matchId && accepted.length) {
      const m = accepted.find(x => x.id === matchId);
      if (m) {
        setSelectedMatch(m);
        fetchMessages(m.id);
      }
    }
  }, [matchId, accepted]);

  // Switch chat thread
  function selectChat(m: Match) {
    setSelectedMatch(m);
    router.replace({ query: { matchId: m.id }}, undefined, { shallow: true });
    fetchMessages(m.id);
  }

  // Send a chat message
  async function handleSend() {
    if (!user || !selectedMatch || !newMessage.trim()) return;
    await supabase.from("messages").insert({
      match_id: selectedMatch.id,
      sender: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  }

  // Generate & send lease PDF
  async function generateLease() {
    if (!selectedMatch || !user) return;
    setGeneratingLease(true);

    const resp = await fetch("/api/lease/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: selectedMatch.id,
        senderId: user.id,
      }),
    });
    const body = await resp.json();
    if (!resp.ok) {
      toast({ title: "Error generating lease", description: body.error, status: "error" });
    } else {
      toast({ title: "Lease sent!", status: "success" });
      // Once done, push to Live Deals
      router.push("/live-deals");
    }

    setGeneratingLease(false);
    setLeaseModalOpen(false);
  }

  if (userLoading || loading) {
    return (
      <DashboardLayout>
        <Box textAlign="center" mt={20}><Spinner size="xl" /></Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Flex h="100%" minH="80vh">
        {/* ─── Left Pane ───────────────────────────────────── */}
        <Box w="300px" borderRight="1px solid" borderColor="gray.200" overflowY="auto">
          <VStack p={4} align="stretch" spacing={4}>
            <Heading size="md">Incoming Likes</Heading>
            {incoming.length===0
              ? <Text color="gray.500">No new likes</Text>
              : incoming.map(m => (
                  <HStack key={m.id} spacing={2}>
                    <Button size="xs" colorScheme="green"
                      onClick={async ()=>{
                        await supabase.from("matches").update({status:"accepted"}).eq("id",m.id);
                        fetchMatches();
                      }}
                    >✓</Button>
                    <Button size="xs" colorScheme="red" variant="outline"
                      onClick={async ()=>{
                        await supabase.from("matches").update({status:"rejected"}).eq("id",m.id);
                        fetchMatches();
                      }}
                    >✕</Button>
                    <NextLink href={`/property/${m.property_id}`} passHref>
                      <Text as="a" flex="1" noOfLines={1}>
                        {properties[m.property_id]?.title||"—"}
                      </Text>
                    </NextLink>
                  </HStack>
                ))
            }

            <Heading size="md" mt={6}>Chats</Heading>
            {accepted.length===0
              ? <Text color="gray.500">No active chats</Text>
              : accepted.map(m => (
                  <Box key={m.id}
                    p={2}
                    borderRadius="md"
                    bg={ selectedMatch?.id===m.id
                          ? useColorModeValue("teal.50","teal.800")
                          : undefined }
                    cursor="pointer"
                    onClick={()=> selectChat(m)}
                  >
                    {properties[m.property_id]?.title||"—"}
                  </Box>
                ))
            }
          </VStack>
        </Box>

        {/* ─── Right Pane ─────────────────────────────────── */}
        <Box flex="1" p={4} display="flex" flexDirection="column">
          {selectedMatch ? (
            <>
              <Heading size="md" mb={4}>
                Chat — {properties[selectedMatch.property_id]?.title}
              </Heading>

              <Box flex="1" overflowY="auto" mb={4}>
                {messages.map(msg => (
                  <Box key={msg.id}
                    textAlign={ msg.sender===user!.id ? "right":"left" }
                    mb={2}
                  >
                    <Text as="span"
                      bg={ msg.sender===user!.id ? "teal.500" : useColorModeValue("gray.200","gray.700") }
                      color={ msg.sender===user!.id ? "white":undefined }
                      px={3} py={1} borderRadius="md" display="inline-block"
                    >
                      {msg.content}
                    </Text>
                  </Box>
                ))}
                <div ref={chatEndRef}/>
              </Box>

              <HStack mb={4}>
                <Input
                  placeholder="Type your message…"
                  value={newMessage}
                  onChange={e=>setNewMessage(e.target.value)}
                />
                <Button colorScheme="teal" onClick={handleSend}>Send</Button>
              </HStack>

              {/* Owner can draft lease */}
              {user!.id===selectedMatch.to_user && (
                <Button colorScheme="blue" onClick={()=>setLeaseModalOpen(true)}>
                  Generate & Send Lease
                </Button>
              )}

              {/* Renter can sign */}
              {selectedMatch.contract_url &&
                user!.id!==selectedMatch.to_user &&
                !selectedMatch.signature_url && (
                  <Button colorScheme="teal" onClick={()=>setSignModalOpen(true)}>
                    Review & Sign Lease
                  </Button>
                )}
            </>
          ) : (
            <Text>Select a chat or incoming like to get started.</Text>
          )}
        </Box>
      </Flex>

      {/* Generate Lease Modal */}
      <Modal isOpen={leaseModalOpen} onClose={()=>setLeaseModalOpen(false)}>
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader>Generate & Send Lease</ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            <Text>This will draft a 12-month lease PDF and send it into the chat.</Text>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="teal"
              mr={3}
              isLoading={generatingLease}
              onClick={generateLease}
            >
              Generate & Send
            </Button>
            <Button onClick={()=>setLeaseModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Sign Lease Modal */}
      {signModalOpen && selectedMatch && (
        <SignContractModal
          isOpen
          matchId={selectedMatch.id}
          onClose={()=>{
            setSignModalOpen(false);
            fetchMatches();
          }}
        />
      )}
    </DashboardLayout>
  );
}