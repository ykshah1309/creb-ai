import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import EditPropertyModal from "@/components/EditPropertyModal";

export default function MyListingsPage() {
  const { user } = useUser();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) setProperties(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchMyProperties();
  }, [user]);

  return (
    <DashboardLayout>
      <Box p={8}>
        <Heading mb={6}>My Property Listings</Heading>

        {loading ? (
          <Flex justify="center">
            <Spinner size="xl" />
          </Flex>
        ) : properties.length === 0 ? (
          <Text>No properties listed yet.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {properties.map((prop) => (
              <Flex
                key={prop.id}
                p={4}
                borderRadius="lg"
                boxShadow="md"
                bg={useColorModeValue("white", "gray.800")}
                direction={{ base: "column", md: "row" }}
                align="center"
              >
                <Image
                  src={prop.image_url}
                  alt={prop.title}
                  boxSize="200px"
                  objectFit="cover"
                  borderRadius="md"
                  mr={{ md: 6 }}
                />
                <Box flex="1">
                  <Heading fontSize="xl">{prop.title}</Heading>
                  <Text color="gray.500">{prop.location}</Text>
                  <Text mt={2}>{prop.description}</Text>
                  <Text mt={1} fontWeight="bold">
                    ${prop.price}
                  </Text>
                </Box>

                <Box mt={{ base: 4, md: 0 }} ml={{ md: 6 }}>
                  <EditPropertyModal
                    property={prop}
                    onUpdate={fetchMyProperties}
                  />
                </Box>
              </Flex>
            ))}
          </VStack>
        )}
      </Box>
    </DashboardLayout>
  );
}