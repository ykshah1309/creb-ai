// pages/my-listings.tsx

import {
  Box,
  Heading,
  Text,
  Image,
  VStack,
  HStack,
  Spinner,
  Button,
  useColorModeValue,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  image_url: string;
  description: string;
  owner_id: string;
}

export default function MyListingsPage() {
  const { user, loading: userLoading } = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) fetchProperties();
  }, [user]);

  async function fetchProperties() {
    setLoading(true);
    const { data, error } = await supabase
      .from<Property>("properties")
      .select("*")
      .eq("owner_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading listings:", error);
    } else {
      setProperties(data);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Deleted",
        description: "Your listing has been removed.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchProperties();
    }
    setDeletingId(null);
  }

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
        <Heading mb={6}>My Listings</Heading>
        {properties.length === 0 ? (
          <Text color="gray.500">You have no listings yet.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {properties.map((prop) => (
              <HStack
                key={prop.id}
                p={4}
                bg={useColorModeValue("white", "gray.800")}
                borderRadius="lg"
                boxShadow="md"
                align="center"
              >
                <Image
                  src={prop.image_url}
                  alt={prop.title}
                  boxSize="100px"
                  objectFit="cover"
                  borderRadius="md"
                />
                <Box flex="1">
                  <Heading size="md">{prop.title}</Heading>
                  <Text fontSize="sm" color="gray.500">
                    {prop.location}
                  </Text>
                </Box>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/post-property?id=${prop.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => setDeletingId(prop.id)}
                  >
                    Delete
                  </Button>
                </HStack>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={!!deletingId}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeletingId(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Listing</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this listing? This action cannot
              be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeletingId(null)}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => deletingId && handleDelete(deletingId)}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </DashboardLayout>
  );
}
