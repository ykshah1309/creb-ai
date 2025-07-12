import {
  Box,
  Heading,
  Text,
  Image,
  VStack,
  Spinner,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

const MotionBox = motion(Box);

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  image_url: string;
  description: string;
  owner_id: string;
}

export default function DashboardPage() {
  const [myListings, setMyListings] = useState<Property[]>([]);
  const [otherListings, setOtherListings] = useState<Property[]>([]);
  const [matchedListings, setMatchedListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;
    fetchListings();
  }, [user]);

  async function fetchListings() {
    setLoading(true);
    const { data: allProps } = await supabase.from("properties").select("*");
    const { data: matches } = await supabase
      .from("matches")
      .select("property_id")
      .eq("from_user", user.id)
      .eq("status", "accepted");

    const matchIds = new Set(matches?.map((m) => m.property_id));
    setMyListings(allProps?.filter((p) => p.owner_id === user.id) || []);
    setOtherListings(allProps?.filter((p) => p.owner_id !== user.id) || []);
    setMatchedListings(allProps?.filter((p) => matchIds.has(p.id)) || []);
    setLoading(false);
  }

  return (
    <DashboardLayout>
      <Box px={6} pt={10} pb={20}>
        <Heading fontSize="3xl" mb={2}>
          Welcome back!
        </Heading>
        <Text fontSize="lg" mb={6} color="gray.500">
          View your listings and matched properties.
        </Text>
        <Button
          colorScheme="teal"
          size="md"
          mb={10}
          onClick={() => router.push("/post-property")}
        >
          Post a Property
        </Button>

        {loading ? (
          <Spinner size="xl" />
        ) : (
          <VStack spacing={12} align="start">
            <ScrollablePanel title="My Listings" data={myListings} />
            <ScrollablePanel title="Other Properties" data={otherListings} />
            <ScrollablePanel title="Matched Listings" data={matchedListings} />
          </VStack>
        )}
      </Box>
    </DashboardLayout>
  );
}

function ScrollablePanel({
  title,
  data,
}: {
  title: string;
  data: Property[];
}) {
  return (
    <Box w="full">
      <Heading size="lg" mb={1}>
        {title}
      </Heading>
      <Text fontSize="sm" color="gray.500" mb={4}>
        {data.length} properties
      </Text>

      <Box
        className="scroll-wrapper"
        display="flex"
        overflowX="auto"
        gap={6}
        pb={2}
        sx={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {data.map((prop) => (
          <MotionBox
            key={prop.id}
            minW="280px"
            maxW="280px"
            bg={useColorModeValue("white", "gray.800")}
            borderRadius="lg"
            overflow="hidden"
            boxShadow="lg"
            transition="all 0.2s ease-in-out"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
            }}
          >
            <Image
              src={prop.image_url}
              alt={prop.title}
              h="160px"
              w="100%"
              objectFit="cover"
              borderTopRadius="lg"
            />
            <Box p={4}>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                {prop.title}
              </Text>
              <Text fontSize="sm" color="gray.600" mb={1}>
                {prop.location}
              </Text>
              <Text fontWeight="semibold" color="green.500" mb={2}>
                ${prop.price.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                {prop.description}
              </Text>
            </Box>
          </MotionBox>
        ))}
      </Box>
    </Box>
  );
}