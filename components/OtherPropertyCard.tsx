// components/OtherPropertyCard.tsx

import { useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Image,
  Heading,
  Text,
  Button,
  LinkBox,
  LinkOverlay,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useUser } from "@/lib/useUser";

export type Property = {
  id: string;
  title: string;
  image_url: string | null;
  location: string;
  price: number;
  description: string;
  owner_id: string;
};

const MotionLinkBox = motion(LinkBox);

export default function OtherPropertyCard({ property }: { property: Property }) {
  const { user } = useUser();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const isOwner = user?.id === property.owner_id;
  const bg = useColorModeValue("white", "gray.800");

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Not signed in", status: "warning" });
      return;
    }
    setLoading(true);

    // call your API route which uses supabase to insert into matches
    const res = await fetch("/api/match/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: property.id }),
    });

    setLoading(false);

    if (res.ok) {
      setLiked(true);
      toast({ title: "Property liked!", status: "success" });
    } else {
      const err = await res.json();
      toast({ title: "Error liking", description: err.error, status: "error" });
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

        {!isOwner && !liked && (
          <Button
            colorScheme="teal"
            size="sm"
            isFullWidth
            isLoading={loading}
            onClick={handleLike}
          >
            Like this property
          </Button>
        )}
        {!isOwner && liked && (
          <Button colorScheme="green" size="sm" isFullWidth isDisabled>
            Liked ✓
          </Button>
        )}
      </Box>
    </MotionLinkBox>
  );
}