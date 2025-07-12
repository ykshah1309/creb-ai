// pages/live-deals.tsx
import {
  Box,
  Button,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
  useDisclosure,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import DashboardLayout from "@/components/DashboardLayout";
import UploadContractModal from "@/components/UploadContractModal";
import SignContractModal from "@/components/SignContractModal";

export default function LiveDealsPage() {
  const { user } = useUser();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const uploadModal = useDisclosure();
  const signModal = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    if (user) fetchDeals();
  }, [user]);

  const fetchDeals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id, contract_url, property_id, from_user, to_user, created_at,
        properties:property_id (
          id, title, image_url, location, price, description, owner_id
        ),
        users:from_user (
          name
        )
      `)
      .eq("status", "accepted")
      .or(`from_user.eq.${user?.id},to_user.eq.${user?.id}`);

    if (error) {
      toast({ title: "Error loading deals", status: "error", description: error.message });
    } else {
      setDeals(data || []);
    }

    setLoading(false);
  };

  const openUpload = (match: any) => {
    setSelectedMatch(match);
    uploadModal.onOpen();
  };

  const openSign = (match: any) => {
    setSelectedMatch(match);
    signModal.onOpen();
  };

  return (
    <DashboardLayout>
      <Box p={10}>
        <Heading mb={6}>Live Deals</Heading>

        {loading ? (
          <Spinner />
        ) : deals.length === 0 ? (
          <Text>No deals found.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {deals.map((deal) => (
              <Box
                key={deal.id}
                borderWidth="1px"
                borderRadius="lg"
                p={5}
                boxShadow="sm"
                bg="white"
              >
                <HStack spacing={6} align="flex-start">
                  <Image
                    src={deal.properties?.image_url || "/placeholder.png"}
                    alt={deal.properties?.title}
                    boxSize="120px"
                    borderRadius="md"
                    objectFit="cover"
                  />
                  <Box flex="1">
                    <Heading size="md">{deal.properties?.title}</Heading>
                    <Text color="gray.500">{deal.properties?.location}</Text>
                    <Text color="green.600" fontWeight="semibold">
                      ${deal.properties?.price?.toLocaleString()}
                    </Text>
                    <Text mt={2}>{deal.properties?.description}</Text>

                    <HStack mt={4}>
                      {deal.contract_url ? (
                        <Button
                          colorScheme="teal"
                          variant="outline"
                          as="a"
                          href={deal.contract_url}
                          target="_blank"
                        >
                          View Contract
                        </Button>
                      ) : user?.id === deal.properties?.owner_id ? (
                        <Button colorScheme="teal" onClick={() => openUpload(deal)}>
                          Upload Contract
                        </Button>
                      ) : (
                        <Button colorScheme="teal" onClick={() => openSign(deal)}>
                          Sign Lease
                        </Button>
                      )}
                    </HStack>
                  </Box>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {selectedMatch && (
        <>
          <UploadContractModal
            isOpen={uploadModal.isOpen}
            onClose={uploadModal.onClose}
            matchId={selectedMatch.id}
          />
          <SignContractModal
            isOpen={signModal.isOpen}
            onClose={signModal.onClose}
          />
        </>
      )}
    </DashboardLayout>
  );
}