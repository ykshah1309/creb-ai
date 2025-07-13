// pages/property/[id].tsx
import {
  Box,
  Heading,
  Text,
  Image,
  VStack,
  Spinner,
  AspectRatio,
  useColorModeValue,
  Button,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  image_url: string;
  description: string;
  // Add any other fields you have, e.g. videos, features, etc.
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchProperty();
  }, [id]);

  async function fetchProperty() {
    setLoading(true);
    const { data, error } = await supabase
      .from<Property>("properties")
      .select("*")
      .eq("id", id as string)
      .single();

    if (error) {
      console.error("Error loading property:", error);
      setLoading(false);
      return;
    }
    setProperty(data);
    setLoading(false);
  }

  if (loading || !property) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box px={6} py={10}>
        {/* Title & Location */}
        <Heading mb={2}>{property.title}</Heading>
        <Text color="gray.500" mb={4}>
          {property.location}
        </Text>

        {/* Main Image */}
        <Image
          src={property.image_url}
          alt={property.title}
          w="100%"
          maxH="400px"
          objectFit="cover"
          borderRadius="lg"
          mb={6}
        />

        {/* Description & Price */}
        <VStack spacing={6} align="start">
          <Text fontWeight="bold" fontSize="2xl">
            ${property.price.toLocaleString()}
          </Text>
          <Text fontSize="md" color={useColorModeValue("gray.700", "gray.300")}>
            {property.description}
          </Text>

          {/* Example: If you had videos, you could map them here */}
          {/* <AspectRatio ratio={16/9} w="100%">
            <video src={videoUrl} controls />
          </AspectRatio> */}

          {/* Back Button */}
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </VStack>
      </Box>
    </DashboardLayout>
  );
}