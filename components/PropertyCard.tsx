// components/PropertyCard.tsx
import {
  LinkBox,
  LinkOverlay,
  Box,
  Image,
  Heading,
  Text,
  Button,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";

export default function PropertyCard({ property }) {
  const { user } = useUser();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Please sign in first", status: "warning" });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("matches")
      .insert({
        from_user: user.id,
        to_user: property.owner_id,
        property_id: property.id,
      });
    setLoading(false);

    if (error) {
      toast({ title: "Error liking", description: error.message, status: "error" });
    } else {
      setLiked(true);
      toast({ title: "Property liked!", status: "success" });
    }
  };

  const bg = useColorModeValue("white", "gray.800");

  return (
    <LinkBox bg={bg} borderRadius="xl" boxShadow="md" overflow="hidden">
      <NextLink href={`/property/${property.id}`} passHref>
        <LinkOverlay>
          <Image
            src={property.image_url || "/placeholder.png"}
            alt={property.title}
            h="160px"
            w="100%"
            objectFit="cover"
          />
          <Box p={4}>
            <Heading size="md">{property.title}</Heading>
            <Text color="gray.600" fontSize="sm">
              {property.location}
            </Text>
            <Text color="green.500" fontWeight="semibold">
              ${property.price.toLocaleString()}
            </Text>
            <Text noOfLines={2} mt={2} fontSize="sm" color="gray.700">
              {property.description}
            </Text>
          </Box>
        </LinkOverlay>
      </NextLink>

      {user?.id !== property.owner_id && (
        <Box p={4}>
          <Button
            isFullWidth
            colorScheme="teal"
            onClick={handleLike}
            isLoading={loading}
            disabled={liked}
          >
            {liked ? "Liked" : "Like this property"}
          </Button>
        </Box>
      )}
    </LinkBox>
  );
}