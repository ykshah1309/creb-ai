// components/PropertyCard.tsx

import Link from "next/link";
import {
  LinkBox,
  LinkOverlay,
  Box,
  Image,
  Text,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  image_url: string | null;
  description: string;
}

export default function PropertyCard({ property }: { property: Property }) {
  const bg = useColorModeValue("white", "gray.800");

  return (
    <LinkBox
      as="article"
      minW="250px"
      maxW="250px"
      bg={bg}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="md"
      _hover={{ transform: "scale(1.03)", boxShadow: "lg" }}
      transition="0.2s"
      cursor="pointer"
    >
      <Link href={`/property/${property.id}`} passHref legacyBehavior>
        <LinkOverlay>
          <Image
            src={property.image_url || "/placeholder.png"}
            alt={property.title}
            h="160px"
            w="100%"
            objectFit="cover"
          />
          <Box p={4}>
            <Heading size="md" mb={1}>
              {property.title}
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={2}>
              {property.location}
            </Text>
            <Text fontWeight="semibold" color="green.500" mb={2}>
              ${property.price.toLocaleString()}
            </Text>
            <Text fontSize="sm" color="gray.700" noOfLines={2}>
              {property.description}
            </Text>
          </Box>
        </LinkOverlay>
      </Link>
    </LinkBox>
  );
}