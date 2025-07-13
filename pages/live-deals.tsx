// pages/live-deals.tsx
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  Spinner,
  Button,
  useColorModeValue,
  Avatar,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";
import UploadContractModal from "@/components/UploadContractModal";
import SignContractModal from "@/components/SignContractModal";

interface MatchRow {
  id: string;
  property_id: string;
  from_user: string;
  to_user: string;
  status: string;
  contract_url?: string;
  signature_url?: string;
  lease_text?: string;
}

interface Property {
  id: string;
  title: string;
  image_url: string | null;
  location: string;
  price: number;
}

interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string;
}

interface Deal {
  match: MatchRow;
  property: Property;
  otherParty: User;
}

export default function LiveDealsPage() {
  const { user, loading: userLoading } = useUser();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadMatchId, setUploadMatchId] = useState<string | null>(null);
  const [signMatchId, setSignMatchId] = useState<string | null>(null);

  // For editing lease text
  const [editingMatch, setEditingMatch] = useState<Deal | null>(null);
  const [draftText, setDraftText] = useState("");

  // Fetch and subscribe
  useEffect(() => {
    if (!user?.id) return;
    fetchDeals();

    const channel = supabase
      .channel("live-deals")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `to_user=eq.${user.id},status=eq.accepted`,
        },
        () => fetchDeals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // load deals
  async function fetchDeals() {
    setLoading(true);
    const { data: matches, error } = await supabase
      .from<MatchRow>("matches")
      .select(
        "*, lease_text" /* ensure lease_text is selected */
      )
      .eq("to_user", user!.id)
      .eq("status", "accepted")
      .not("contract_url", "is", null);

    if (error) {
      console.error(error);
      setDeals([]);
      setLoading(false);
      return;
    }

    const out: Deal[] = [];
    for (const m of matches || []) {
      // property
      const { data: prop } = await supabase
        .from<Property>("properties")
        .select("*")
        .eq("id", m.property_id)
        .single();
      if (!prop) continue;

      // other party
      const { data: other } = await supabase
        .from<User>("users")
        .select("*")
        .eq("id", m.from_user)
        .single();
      if (!other) continue;

      out.push({ match: m, property: prop, otherParty: other });
    }

    setDeals(out);
    setLoading(false);
  }

  // Open edit modal
  const onClickEdit = (deal: Deal) => {
    setEditingMatch(deal);
    setDraftText(deal.match.lease_text || "");
  };

  // Save edited lease
  const saveEdit = async () => {
    if (!editingMatch) return;
    await fetch("/api/lease/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: editingMatch.match.id,
        leaseText: draftText,
      }),
    });
    setEditingMatch(null);
    fetchDeals();
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box px={6} py={10}>
        <Heading mb={6}>Live Deals</Heading>

        {!deals.length ? (
          <Text color="gray.500">No active deals right now.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {deals.map(({ match, property, otherParty }) => {
              const amOwner = match.to_user === user!.id;
              return (
                <HStack
                  key={match.id}
                  p={4}
                  bg={useColorModeValue("white", "gray.800")}
                  borderRadius="lg"
                  boxShadow="md"
                  align="center"
                >
                  <Image
                    src={property.image_url ?? "/placeholder.png"}
                    alt={property.title}
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="md"
                  />

                  <Box flex="1">
                    <Heading size="md">{property.title}</Heading>
                    <Text fontSize="sm" color="gray.500">
                      {property.location} — $
                      {property.price.toLocaleString()}
                    </Text>

                    <HStack mt={2} spacing={3}>
                      <Avatar
                        size="sm"
                        src={otherParty.avatar_url ?? undefined}
                        name={otherParty.name}
                      />
                      <Text fontWeight="medium">
                        {otherParty.name}{" "}
                        <Text as="span" color="gray.500" fontSize="sm">
                          ({otherParty.email})
                        </Text>
                      </Text>
                    </HStack>
                  </Box>

                  <Badge
                    colorScheme={
                      match.signature_url
                        ? "green"
                        : match.contract_url
                        ? "blue"
                        : "orange"
                    }
                  >
                    {match.signature_url
                      ? "Signed"
                      : "Uploaded"}
                  </Badge>

                  <VStack spacing={2}>
                    {amOwner && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => onClickEdit({ match, property, otherParty })}
                      >
                        Edit Lease
                      </Button>
                    )}
                    {/* tenant sign */}
                    {!amOwner &&
                      match.contract_url &&
                      !match.signature_url && (
                        <Button
                          size="sm"
                          colorScheme="teal"
                          onClick={() => setSignMatchId(match.id)}
                        >
                          Sign Lease
                        </Button>
                      )}
                  </VStack>
                </HStack>
              );
            })}
          </VStack>
        )}
      </Box>

      {/* Upload (re-generate) modal */}
      {editingMatch && (
        <Modal isOpen onClose={() => setEditingMatch(null)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Lease</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={10}
              />
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="teal" mr={3} onClick={saveEdit}>
                Save & Regenerate
              </Button>
              <Button onClick={() => setEditingMatch(null)}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Sign modal */}
      {signMatchId && (
        <SignContractModal
          isOpen
          matchId={signMatchId}
          onClose={() => {
            setSignMatchId(null);
            fetchDeals();
          }}
        />
      )}
    </DashboardLayout>
  );
}