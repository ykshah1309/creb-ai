// components/OtherPropertyCard.tsx

import { useState, useEffect } from "react";
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
  Spinner,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
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
  const { user, loading: userLoading } = useUser();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const isOwner = user?.id === property.owner_id;
  const bg = useColorModeValue("white", "gray.800");

  // If this session has already liked this property, mark it as liked:
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id")
        .eq("from_user", user.id)
        .eq("property_id", property.id)
        .single();
      if (!error && data) setLiked(true);
    })();
  }, [user, property.id]);

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Not signed in", status: "warning" });
      return;
    }
    setLoading(true);

    // Insert a new "match" row
    const { error } = await supabase
      .from("matches")
      .insert({
        from_user: user.id,
        to_user: property.owner_id,
        property_id: property.id,
        status: "pending",
      });

    setLoading(false);

    if (error) {
      toast({ title: "Error liking", description: error.message, status: "error" });
    } else {
      setLiked(true);
      toast({ title: "Property liked!", status: "success" });
    }
  };

  // while we’re determining user/loading state, show a spinner placeholder
  if (userLoading) {
    return (
      <Box
        bg={bg}
        borderRadius="xl"
        overflow="hidden"
        boxShadow="md"
        minW="250px"
        maxW="250px"
        h="300px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner />
      </Box>
    );
  }

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

        {!isOwner && (
          <>
            {!liked ? (
              <Button
                colorScheme="teal"
                size="sm"
                isFullWidth
                isLoading={loading}
                onClick={handleLike}
              >
                Like this property
              </Button>
            ) : (
              <Button colorScheme="green" size="sm" isFullWidth isDisabled>
                Liked ✓
              </Button>
            )}
          </>
        )}
      </Box>
    </MotionLinkBox>
  );
}