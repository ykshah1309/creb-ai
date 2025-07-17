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
  IconButton,
  Avatar,
  Divider,
  Tooltip,
  Image,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import { FiCheck, FiX, FiMessageSquare } from "react-icons/fi";
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  async function fetchMessages(mid: string) {
    const { data } = await supabase
      .from<Message>("messages")
      .select("*")
      .eq("match_id", mid)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }

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

  useEffect(() => { if (user) fetchMatches(); }, [user]);

  useEffect(() => {
    if (matchId && accepted.length) {
      const m = accepted.find(x => x.id === matchId);
      if (m) {
        setSelectedMatch(m);
        fetchMessages(m.id);
      }
    }
  }, [matchId, accepted]);

  function selectChat(m: Match) {
    setSelectedMatch(m);
    router.replace({ query: { matchId: m.id }}, undefined, { shallow: true });
    fetchMessages(m.id);
  }

  async function handleSend() {
    if (!user || !selectedMatch || !newMessage.trim()) return;
    await supabase.from("messages").insert({
      match_id: selectedMatch.id,
      sender: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  }

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
      <Flex h="100%" minH="85vh" bg={useColorModeValue("gray.50", "gray.900")}>
        {/* Left Pane */}
        <Box
          w={{ base: "100%", md: "370px" }}
          borderRight="1px solid"
          borderColor={useColorModeValue("gray.200", "gray.800")}
          py={0}
          bg={useColorModeValue("white", "gray.900")}
          minH="85vh"
        >
          <VStack p={4} align="stretch" spacing={6}>
            <Box>
              <Heading size="sm" mb={3}>Incoming Likes</Heading>
              <VStack spacing={3} align="stretch">
                {incoming.length === 0 ? (
                  <Text color="gray.400" fontSize="sm">No new likes</Text>
                ) : (
                  incoming.map(m => {
                    const prop = properties[m.property_id];
                    return (
                      <Flex
                        key={m.id}
                        align="center"
                        bg={useColorModeValue("gray.100", "gray.800")}
                        borderRadius="lg"
                        px={3}
                        py={2}
                        boxShadow="sm"
                        gap={3}
                        _hover={{ boxShadow: "md" }}
                        transition="box-shadow 0.15s"
                      >
                        {prop?.image_url && (
                          <Image
                            src={prop.image_url}
                            alt={prop.title}
                            boxSize="38px"
                            borderRadius="md"
                            objectFit="cover"
                            mr={2}
                          />
                        )}
                        <Box flex="1" minW={0}>
                          <Text fontWeight="semibold" fontSize="sm" isTruncated>
                            {prop?.title || "—"}
                          </Text>
                          <Text fontSize="xs" color="gray.400" isTruncated>
                            {prop?.location || ""}
                          </Text>
                        </Box>
                        <Tooltip label="Accept">
                          <IconButton
                            icon={<FiCheck />}
                            size="sm"
                            aria-label="Accept"
                            colorScheme="teal"
                            variant="outline"
                            rounded="full"
                            onClick={async () => {
                              await supabase.from("matches").update({ status: "accepted" }).eq("id", m.id);
                              fetchMatches();
                            }}
                          />
                        </Tooltip>
                        <Tooltip label="Reject">
                          <IconButton
                            icon={<FiX />}
                            size="sm"
                            aria-label="Reject"
                            colorScheme="red"
                            variant="outline"
                            rounded="full"
                            ml={1}
                            onClick={async () => {
                              await supabase.from("matches").update({ status: "rejected" }).eq("id", m.id);
                              fetchMatches();
                            }}
                          />
                        </Tooltip>
                      </Flex>
                    );
                  })
                )}
              </VStack>
            </Box>

            <Divider my={2} />

            <Box>
              <Heading size="sm" mb={3}>Chats</Heading>
              <VStack spacing={1} align="stretch">
                {accepted.length === 0 ? (
                  <Text color="gray.400" fontSize="sm">No active chats</Text>
                ) : (
                  accepted.map(m => {
                    const prop = properties[m.property_id];
                    return (
                      <Flex
                        key={m.id}
                        align="center"
                        px={2}
                        py={2}
                        bg={selectedMatch?.id === m.id ? "teal.50" : "transparent"}
                        borderRadius="lg"
                        cursor="pointer"
                        _hover={{ bg: useColorModeValue("gray.100", "gray.800") }}
                        onClick={() => selectChat(m)}
                        transition="background 0.13s"
                        gap={3}
                      >
                        <Avatar
                          size="sm"
                          name={prop?.title}
                          src={prop?.image_url || undefined}
                          mr={2}
                        />
                        <Box flex="1" minW={0}>
                          <Text isTruncated fontWeight="medium" fontSize="sm">
                            {prop?.title || "—"}
                          </Text>
                          <Text fontSize="xs" color="gray.400" isTruncated>
                            {prop?.location}
                          </Text>
                        </Box>
                        <FiMessageSquare color="#319795" />
                      </Flex>
                    );
                  })
                )}
              </VStack>
            </Box>
          </VStack>
        </Box>

        {/* Right Pane */}
        <Box flex="1" p={6} display="flex" flexDirection="column" minW={0}>
          {selectedMatch ? (
            <>
              <Heading size="sm" mb={4}>
                Chat — {properties[selectedMatch.property_id]?.title}
              </Heading>

              <Box
                flex="1"
                overflowY="auto"
                mb={4}
                px={2}
                bg={useColorModeValue("white", "gray.900")}
                borderRadius="lg"
                boxShadow="sm"
                py={4}
                maxH="60vh"
              >
                {messages.map(msg => (
                  <Box key={msg.id}
                    textAlign={msg.sender === user!.id ? "right" : "left"}
                    mb={2}
                  >
                    <Box
                      as="span"
                      bg={msg.sender === user!.id ? "teal.500" : useColorModeValue("gray.200", "gray.700")}
                      color={msg.sender === user!.id ? "white" : undefined}
                      px={3}
                      py={2}
                      borderRadius="xl"
                      display="inline-block"
                      fontSize="sm"
                      maxW="70%"
                      wordBreak="break-word"
                      boxShadow={msg.sender === user!.id ? "md" : "sm"}
                    >
                      {msg.content}
                    </Box>
                  </Box>
                ))}
                <div ref={chatEndRef} />
              </Box>

              <HStack mt={2} mb={4}>
                <Input
                  placeholder="Type your message…"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                />
                <Button colorScheme="teal" px={6} onClick={handleSend}>Send</Button>
              </HStack>

              {/* Owner can draft lease */}
              {user!.id === selectedMatch.to_user && (
                <Button colorScheme="blue" mt={2} onClick={() => setLeaseModalOpen(true)}>
                  Generate & Send Lease
                </Button>
              )}

              {/* Renter can sign */}
              {selectedMatch.contract_url &&
                user!.id !== selectedMatch.to_user &&
                !selectedMatch.signature_url && (
                  <Button colorScheme="teal" mt={2} onClick={() => setSignModalOpen(true)}>
                    Review & Sign Lease
                  </Button>
                )}
            </>
          ) : (
            <Flex align="center" justify="center" height="100%">
              <Text color="gray.500" fontSize="lg">
                Select a chat or incoming like to get started.
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>

      {/* Generate Lease Modal */}
      <Modal isOpen={leaseModalOpen} onClose={() => setLeaseModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate & Send Lease</ModalHeader>
          <ModalCloseButton />
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
            <Button onClick={() => setLeaseModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Sign Lease Modal */}
      {signModalOpen && selectedMatch && (
        <SignContractModal
          isOpen
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