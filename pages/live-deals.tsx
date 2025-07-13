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
  status: string;
  // assume you added these fields:
  contract_url?: string;
  signature_url?: string;
}

interface Property {
  id: string;
  title: string;
  image_url: string;
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
  requester: User;
}

export default function LiveDealsPage() {
  const { user, loading: userLoading } = useUser();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [uploadMatchId, setUploadMatchId] = useState<string | null>(null);
  const [signMatchId, setSignMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadDeals();
  }, [user]);

  async function loadDeals() {
    setLoading(true);

    // 1) Fetch all accepted matches where you are the owner (to_user)
    const { data: matches, error: matchErr } = await supabase
      .from<MatchRow>("matches")
      .select("id, property_id, from_user, status, contract_url, signature_url")
      .eq("to_user", user!.id)
      .eq("status", "accepted");

    if (matchErr) {
      console.error("Error loading deals:", matchErr);
      setLoading(false);
      return;
    }

    // 2) For each match, fetch property and requesting user
    const dealsData: Deal[] = [];
    for (const m of matches!) {
      // property
      const { data: prop, error: propErr } = await supabase
        .from<Property>("properties")
        .select("id, title, image_url, location, price")
        .eq("id", m.property_id)
        .single();

      if (propErr || !prop) {
        console.error("Error loading property:", propErr);
        continue;
      }

      // requester (from_user)
      const { data: reqUser, error: userErr } = await supabase
        .from<User>("users")
        .select("id, name, avatar_url, email")
        .eq("id", m.from_user)
        .single();

      if (userErr || !reqUser) {
        console.error("Error loading user:", userErr);
        continue;
      }

      dealsData.push({
        match: m,
        property: prop,
        requester: reqUser,
      });
    }

    setDeals(dealsData);
    setLoading(false);
  }

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

        {deals.length === 0 ? (
          <Text color="gray.500">No active deals right now.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {deals.map(({ match, property, requester }) => (
              <HStack
                key={match.id}
                p={4}
                bg={useColorModeValue("white", "gray.800")}
                borderRadius="lg"
                boxShadow="md"
                align="center"
              >
                {/* Property Image */}
                <Image
                  src={property.image_url}
                  alt={property.title}
                  boxSize="100px"
                  objectFit="cover"
                  borderRadius="md"
                />

                {/* Details */}
                <Box flex="1">
                  <Heading size="md">{property.title}</Heading>
                  <Text fontSize="sm" color="gray.500">
                    {property.location} — ${property.price.toLocaleString()}
                  </Text>

                  <HStack mt={2} spacing={3}>
                    <Avatar
                      size="sm"
                      src={requester.avatar_url || undefined}
                      name={requester.name}
                    />
                    <Text fontWeight="medium">
                      {requester.name}
                      <Text as="span" color="gray.500" fontSize="sm">
                        {" "}
                        ({requester.email})
                      </Text>
                    </Text>
                  </HStack>
                </Box>

                {/* Contract Status */}
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
                    : match.contract_url
                    ? "Uploaded"
                    : "Pending"}
                </Badge>

                {/* Actions */}
                <VStack spacing={2}>
                  {!match.contract_url && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => setUploadMatchId(match.id)}
                    >
                      Upload Contract
                    </Button>
                  )}
                  {match.contract_url && !match.signature_url && (
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => setSignMatchId(match.id)}
                    >
                      Sign Contract
                    </Button>
                  )}
                </VStack>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>

      {/* Upload Modal */}
      {uploadMatchId && (
        <UploadContractModal
          isOpen={true}
          onClose={() => {
            setUploadMatchId(null);
            loadDeals();
          }}
          matchId={uploadMatchId}
        />
      )}

      {/* Sign Modal */}
      {signMatchId && (
        <SignContractModal
          isOpen={true}
          onClose={() => {
            setSignMatchId(null);
            loadDeals();
          }}
          matchId={signMatchId}
        />
      )}
    </DashboardLayout>
  );
}