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
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Fade,
  IconButton,
  Tooltip,
  Stack,
  Badge,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";
import { FiEdit2, FiTrash2, FiEye, FiShield } from "react-icons/fi";

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  image_url: string;
  description: string;
  owner_id: string;
  size_sf?: number;
  rent_per_sf?: number;
  monthly_rent?: number;
  is_verified?: boolean;
  verification_status?: string;
}

export default function MyListingsPage() {
  const { user, loading: userLoading } = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) fetchProperties();
    // eslint-disable-next-line
  }, [user]);

  async function fetchProperties() {
    setLoading(true);
    const { data, error } = await supabase
      .from<Property>("properties")
      .select("*")
      .eq("owner_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading listings",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } else {
      setProperties(data ?? []);
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

  async function handleRequestVerification(id: string) {
    setVerifying(id);
    // Set verification_status = 'pending', verification_requested_at = now()
    const { error } = await supabase
      .from("properties")
      .update({
        verification_status: "pending",
        verification_requested_at: new Date().toISOString(),
      })
      .eq("id", id);

    setVerifying(null);

    if (error) {
      toast({
        title: "Verification request failed",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Verification requested",
        description: "Admin will review your property soon.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      fetchProperties();
    }
  }

  // --- CARD COMPONENT ---
  const PropertyCard = ({ prop }: { prop: Property }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const cardBg = useColorModeValue("white", "gray.800");
    const hoverShadow = useColorModeValue("0 8px 32px 0 rgba(0,0,0,0.08)", "0 8px 32px 0 rgba(0,0,0,0.25)");

    // Choose badge color based on status
    let badge;
    if (prop.is_verified || prop.verification_status === "approved") {
      badge = <Badge colorScheme="teal" px={2} py={1} borderRadius="md" fontSize="sm" fontWeight="bold">Verified</Badge>;
    } else if (prop.verification_status === "pending") {
      badge = <Badge colorScheme="yellow" px={2} py={1} borderRadius="md" fontSize="sm">Pending Verification</Badge>;
    } else if (prop.verification_status === "rejected") {
      badge = <Badge colorScheme="red" px={2} py={1} borderRadius="md" fontSize="sm">Rejected</Badge>;
    } else {
      badge = <Badge colorScheme="gray" px={2} py={1} borderRadius="md" fontSize="sm">Not Verified</Badge>;
    }

    return (
      <Fade in={true}>
        <Box
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="md"
          maxW="700px"
          mx="auto"
          w="100%"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          transition="all 0.16s cubic-bezier(.4,0,.2,1)"
          _hover={{ boxShadow: hoverShadow, transform: "translateY(-2px) scale(1.015)" }}
          overflow="hidden"
          px={4}
          py={3}
        >
          {/* Image */}
          <Skeleton isLoaded={imgLoaded} minW="80px" minH="80px" borderRadius="xl">
            <Image
              src={prop.image_url}
              alt={prop.title}
              boxSize="80px"
              objectFit="cover"
              borderRadius="xl"
              onLoad={() => setImgLoaded(true)}
              fallbackSrc="/placeholder.png"
            />
          </Skeleton>

          {/* Property Info */}
          <Box flex="1" minW={0} ml={5} py={1} onClick={() => setSelectedProperty(prop)} cursor="pointer">
            <HStack mb={1} spacing={3}>
              <Heading size="md" isTruncated>{prop.title}</Heading>
              {badge}
            </HStack>
            <Text fontSize="sm" color="gray.400" isTruncated>
              {prop.location}
            </Text>
            <Stack direction={{ base: "column", sm: "row" }} spacing={4} mt={1} fontSize="sm" color="gray.500">
              {prop.size_sf && <Text>{prop.size_sf} SF</Text>}
              {prop.price && <Text>${prop.price}</Text>}
              {prop.monthly_rent && <Text>Rent: ${prop.monthly_rent}/mo</Text>}
            </Stack>
          </Box>

          {/* Actions */}
          <VStack spacing={1} align="center" ml={4}>
            <Tooltip label="View Details" hasArrow>
              <IconButton
                size="md"
                icon={<FiEye />}
                aria-label="View"
                variant="ghost"
                onClick={() => setSelectedProperty(prop)}
                fontSize="lg"
              />
            </Tooltip>
            <Tooltip label="Edit" hasArrow>
              <IconButton
                size="md"
                icon={<FiEdit2 />}
                aria-label="Edit"
                variant="ghost"
                onClick={() => router.push(`/post-property?id=${prop.id}`)}
                fontSize="lg"
              />
            </Tooltip>
            <Tooltip label="Delete" hasArrow>
              <IconButton
                size="md"
                icon={<FiTrash2 />}
                aria-label="Delete"
                colorScheme="red"
                variant="ghost"
                onClick={() => setDeletingId(prop.id)}
                fontSize="lg"
              />
            </Tooltip>
            {/* Request Verification */}
            {(prop.verification_status !== "pending" && prop.verification_status !== "approved" && !prop.is_verified) && (
              <Tooltip label="Request Verification" hasArrow>
                <Button
                  size="xs"
                  leftIcon={<FiShield />}
                  colorScheme="teal"
                  isLoading={verifying === prop.id}
                  onClick={() => handleRequestVerification(prop.id)}
                  mt={1}
                  variant="solid"
                  fontWeight="bold"
                  borderRadius="full"
                >
                  Verify
                </Button>
              </Tooltip>
            )}
            {(prop.verification_status === "pending") && (
              <Tooltip label="Verification pending" hasArrow>
                <Button
                  size="xs"
                  leftIcon={<FiShield />}
                  colorScheme="yellow"
                  isDisabled
                  mt={1}
                  variant="outline"
                  borderRadius="full"
                >
                  Pending
                </Button>
              </Tooltip>
            )}
            {(prop.verification_status === "approved" || prop.is_verified) && (
              <Tooltip label="Verified" hasArrow>
                <Button
                  size="xs"
                  leftIcon={<FiShield />}
                  colorScheme="teal"
                  isDisabled
                  mt={1}
                  variant="outline"
                  borderRadius="full"
                >
                  Verified
                </Button>
              </Tooltip>
            )}
          </VStack>
        </Box>
      </Fade>
    );
  };

  // --- DETAILS MODAL ---
  const PropertyModal = () =>
    selectedProperty && (
      <Modal isOpen={!!selectedProperty} onClose={() => setSelectedProperty(null)} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedProperty.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              {selectedProperty.image_url && (
                <Image
                  src={selectedProperty.image_url}
                  alt={selectedProperty.title}
                  borderRadius="lg"
                  w="100%"
                  h="200px"
                  objectFit="cover"
                />
              )}
              <Text color="gray.600" fontSize="md">
                <b>Location:</b> {selectedProperty.location}
              </Text>
              <Text color="gray.500">
                <b>Description:</b> {selectedProperty.description}
              </Text>
              {selectedProperty.size_sf && (
                <Text>
                  <b>Size (SF):</b> {selectedProperty.size_sf}
                </Text>
              )}
              {selectedProperty.price && (
                <Text>
                  <b>Price:</b> ${selectedProperty.price}
                </Text>
              )}
              {selectedProperty.rent_per_sf && (
                <Text>
                  <b>Rent/SF:</b> ${selectedProperty.rent_per_sf}
                </Text>
              )}
              {selectedProperty.monthly_rent && (
                <Text>
                  <b>Monthly Rent:</b> ${selectedProperty.monthly_rent}
                </Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );

  if (userLoading || loading) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box bg={useColorModeValue("gray.50", "gray.900")} minH="100vh" px={{ base: 2, md: 6 }} py={10} maxW="900px" mx="auto">
        <Heading mb={6}>My Listings</Heading>
        {properties.length === 0 ? (
          <VStack pt={10} spacing={3}>
            <Text color="gray.500" fontSize="lg">
              You have no listings yet.
            </Text>
            <Button colorScheme="teal" size="md" onClick={() => router.push("/dashboard")}>
              + Add your first property
            </Button>
          </VStack>
        ) : (
          <VStack spacing={5} align="stretch" maxW="700px" mx="auto">
            {properties.map((prop) => (
              <PropertyCard key={prop.id} prop={prop} />
            ))}
          </VStack>
        )}
      </Box>

      {/* Property Details Popup */}
      <PropertyModal />

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