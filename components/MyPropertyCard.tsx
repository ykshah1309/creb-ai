// components/MyPropertyCard.tsx

import { useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Image,
  Heading,
  Text,
  Button,
  LinkBox,
  LinkOverlay,
  VStack,
  HStack,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import type { Property } from "./OtherPropertyCard";

type PendingMatch = {
  id: string;
  from_user: string;
  users: { name: string };
};

const MotionLinkBox = motion(LinkBox);

export default function MyPropertyCard({ property }: { property: Property }) {
  const { user } = useUser();
  const toast = useToast();
  const [pending, setPending] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const bg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (!user) return;
    supabase
      .from<PendingMatch>("matches")
      .select("id, from_user, users(name)")
      .eq("property_id", property.id)
      .eq("status", "pending")
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setPending(data || []);
      });
  }, [property.id, user]);

  const accept = async (matchId: string) => {
    setLoading(true);
    const res = await fetch("/api/match/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: matchId }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Match accepted!", status: "success" });
      setPending((p) => p.filter((m) => m.id !== matchId));
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error, status: "error" });
    }
  };

  return (
    <MotionLinkBox
      as="article"
      bg={bg}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="md"
      minW="250px"
      maxW="250px"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <Image
        src={property.image_url ?? "/placeholder.png"}
        alt={property.title}
        objectFit="cover"
        w="100%"
        h="160px"
      />

      <Box p={4}>
        <NextLink href={`/property/${property.id}`} passHref>
          <LinkOverlay>
            <Heading size="md" mb={1}>
              {property.title}
            </Heading>
          </LinkOverlay>
        </NextLink>

        <Text fontSize="sm" color="gray.500">
          {property.location}
        </Text>

        <Text fontWeight="semibold" color="green.500" my={2}>
          ${property.price.toLocaleString()}
        </Text>

        <Text fontSize="sm" noOfLines={2} mb={4}>
          {property.description}
        </Text>
      </Box>

      {pending.length > 0 && (
        <Box p={4} borderTop="1px solid" borderColor="gray.200">
          <VStack spacing={3} align="stretch">
            {pending.map((m) => (
              <HStack key={m.id} justify="space-between">
                <Text fontSize="sm">{m.users.name} liked this</Text>
                <Button
                  size="sm"
                  colorScheme="teal"
                  isLoading={loading}
                  onClick={() => accept(m.id)}
                >
                  Accept
                </Button>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </MotionLinkBox>
  );
}