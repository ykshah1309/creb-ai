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
  Link,
  useColorModeValue,
  Avatar,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";

interface MatchRow {
  id: string;
  property_id: string;
  from_user: string;
  to_user: string;
  status: string;
  contract_url: string;
  signature_url?: string;
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
  amIssuer: boolean;
}

export default function LiveDealsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchDeals();
  }, [router.asPath, user?.id]);

  async function fetchDeals() {
    setLoading(true);

    const { data: matches, error } = await supabase
      .from<MatchRow>("matches")
      .select("id,property_id,from_user,to_user,status,contract_url,signature_url")
      .eq("status", "accepted")
      .not("contract_url", "is", null)
      .or(`from_user.eq.${user!.id},to_user.eq.${user!.id}`);

    console.log("live-deals raw:", { matches, error });

    if (error || !matches) {
      setDeals([]);
      setLoading(false);
      return;
    }

    const out: Deal[] = [];
    for (const m of matches) {
      // property
      const { data: prop } = await supabase
        .from<Property>("properties")
        .select("id,title,image_url,location,price")
        .eq("id", m.property_id)
        .single();
      if (!prop) continue;

      // other party
      const otherId = m.from_user === user!.id ? m.to_user : m.from_user;
      const { data: other } = await supabase
        .from<User>("users")
        .select("id,name,avatar_url,email")
        .eq("id", otherId)
        .single();
      if (!other) continue;

      out.push({
        match: m,
        property: prop,
        otherParty: other,
        amIssuer: m.from_user === user!.id,
      });
    }

    setDeals(out);
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
            {deals.map(({ match, property, otherParty, amIssuer }) => (
              <HStack
                key={match.id}
                p={4}
                bg={useColorModeValue("white","gray.800")}
                borderRadius="lg"
                boxShadow="md"
                align="start"
              >
                {/* Property */}
                <Image
                  src={property.image_url ?? "/placeholder.png"}
                  alt={property.title}
                  boxSize="100px"
                  objectFit="cover"
                  borderRadius="md"
                />

                <Box flex="1">
                  <Heading size="md">{property.title}</Heading>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    {property.location} — ${property.price.toLocaleString()}
                  </Text>

                  <HStack spacing={2}>
                    <Avatar
                      size="sm"
                      src={otherParty.avatar_url ?? undefined}
                      name={otherParty.name}
                    />
                    <Text>
                      {otherParty.name}{" "}
                      <Text as="span" color="gray.500" fontSize="sm">
                        ({otherParty.email})
                      </Text>
                    </Text>
                  </HStack>

                  <Box mt={3}>
                    <Link href={match.contract_url} isExternal color="teal.500">
                      📄 View Lease PDF
                    </Link>
                  </Box>
                </Box>

                <VStack spacing={2}>
                  <Badge colorScheme={match.signature_url ? "green" : "blue"}>
                    {match.signature_url ? "Signed" : "Lease Sent"}
                  </Badge>

                  {amIssuer && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={()=>router.push(`/matches?matchId=${match.id}`)}
                    >
                      Edit Lease
                    </Button>
                  )}
                  {!match.signature_url && (
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={()=>router.push(`/matches?matchId=${match.id}`)}
                    >
                      Sign Lease
                    </Button>
                  )}
                </VStack>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </DashboardLayout>
  );
}