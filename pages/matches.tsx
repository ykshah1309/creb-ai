// pages/matches.tsx

import {
  Box,
  Heading,
  Text,
  Image,
  VStack,
  Spinner,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  image_url: string;
  description: string;
  owner_id: string;
}

interface User {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface MatchData {
  id: string;
  property: Property;
  otherUser: User;
}

export default function MatchesPage() {
  const { user, loading: userLoading } = useUser();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    loadMatches();
  }, [user]);

  async function loadMatches() {
    setLoading(true);

    // 1) Fetch accepted matches where current user is from_user or to_user
    const { data: rawMatches, error: matchErr } = await supabase
      .from("matches")
      .select("id, property:properties(*), from_user, to_user")
      .or(
        `and(status.eq.accepted,from_user.eq.${user!.id}),and(status.eq.accepted,to_user.eq.${user!.id})`
      );

    if (matchErr) {
      console.error("Error fetching matches:", matchErr);
      setLoading(false);
      return;
    }

    // 2) For each match, determine the other user's ID and fetch their profile
    const enriched: MatchData[] = [];
    for (const m of rawMatches!) {
      const otherUserId = m.from_user === user!.id ? m.to_user : m.from_user;
      const { data: otherUser, error: userErr } = await supabase
        .from<User>("users")
        .select("id,name,avatar_url")
        .eq("id", otherUserId)
        .single();

      if (userErr || !otherUser) {
        console.error("Error fetching user:", userErr);
        continue;
      }

      enriched.push({
        id: m.id,
        property: m.property,
        otherUser,
      });
    }

    setMatches(enriched);
    setLoading(false);
  }

  // Show spinner while loading user or matches
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
        <Heading mb={6}>Your Matches</Heading>

        {matches.length === 0 ? (
          <Text color="gray.500">You have no matches yet.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {matches.map(({ id, property, otherUser }) => (
              <Box
                key={id}
                display="flex"
                flexDirection={{ base: "column", md: "row" }}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                _hover={{ boxShadow: "lg", cursor: "pointer" }}
                onClick={() => router.push(`/chat/${id}`)}
              >
                {/* Property image */}
                <Image
                  src={property.image_url}
                  alt={property.title}
                  objectFit="cover"
                  w={{ base: "100%", md: "200px" }}
                  h="160px"
                />

                {/* Details */}
                <Box
                  flex="1"
                  p={4}
                  bg={useColorModeValue("white", "gray.800")}
                >
                  <Heading size="md">{property.title}</Heading>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    {property.location}
                  </Text>

                  <Text mb={3}>
                    Chatting with{" "}
                    <Text as="span" fontWeight="bold">
                      {otherUser.name}
                    </Text>
                  </Text>

                  <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/chat/${id}`);
                    }}
                  >
                    Open Chat
                  </Button>
                </Box>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </DashboardLayout>
  );
}