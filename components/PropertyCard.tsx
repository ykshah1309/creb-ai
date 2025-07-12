import {
  Box,
  Image,
  Text,
  Badge,
  Button,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

interface Property {
  id: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  price: number;
  owner_id: string;
}

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const user = useUser();
  const toast = useToast();

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please login to like a property",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const { data, error } = await supabase.from("matches").insert([
      {
        from_user: user.id,
        to_user: property.owner_id,
        property_id: property.id,
        status: "pending",
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Match Request Sent",
        description: "The owner has been notified.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      maxW="sm"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      p={4}
    >
      <Image src={property.image_url} alt={property.title} borderRadius="md" />

      <Stack mt={4} spacing={2}>
        <Badge colorScheme="green" w="fit-content">
          ${property.price}
        </Badge>
        <Text fontWeight="bold" fontSize="xl">
          {property.title}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {property.location}
        </Text>
        <Text fontSize="md">{property.description}</Text>
        <Button colorScheme="teal" onClick={handleLike}>
          Like
        </Button>
      </Stack>
    </Box>
  );
};

export default PropertyCard;