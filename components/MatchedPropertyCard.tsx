// components/MatchedPropertyCard.tsx
import NextLink from "next/link";
import {
  Box,
  LinkBox,
  LinkOverlay,
  Image,
  Heading,
  Text,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import type { Property } from "./OtherPropertyCard";

export default function MatchedPropertyCard({
  property,
  matchId,
}: {
  property: Property;
  matchId: string;
}) {
  const bg = useColorModeValue("white", "gray.800");
  return (
    <LinkBox
      as="article"
      bg={bg}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="md"
      minW="250px"
      maxW="250px"
    >
      <NextLink href={`/property/${property.id}`} passHref>
        <LinkOverlay>
          <Image
            src={property.image_url ?? "/placeholder.png"}
            alt={property.title}
            objectFit="cover"
            w="100%"
            h="160px"
          />
          <Box p={4}>
            <Heading size="md">{property.title}</Heading>
            <Text fontSize="sm" color="gray.500">
              {property.location}
            </Text>
            <Text fontWeight="semibold" color="green.500">
              ${property.price.toLocaleString()}
            </Text>
          </Box>
        </LinkOverlay>
      </NextLink>
      <Box p={4}>
        <NextLink href={`/chat/${matchId}`} passHref>
          <Button as="a" w="full" colorScheme="teal">
            Chat
          </Button>
        </NextLink>
      </Box>
    </LinkBox>
  );
}