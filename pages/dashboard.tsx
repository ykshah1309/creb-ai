// pages/dashboard.tsx

import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  Button,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  StackDivider,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import PropertyCard, { Property as PropertyType } from "@/components/PropertyCard";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [allProps, setAllProps] = useState<PropertyType[]>([]);
  const [myListings, setMyListings] = useState<PropertyType[]>([]);
  const [otherListings, setOtherListings] = useState<PropertyType[]>([]);
  const [matchedListings, setMatchedListings] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const showBrowse = router.query.mode === "browse";

  // Search form state
  const [locFilter, setLocFilter] = useState("");
  const [minSize, setMinSize] = useState<number>(0);
  const [maxSize, setMaxSize] = useState<number>(0);
  const [minRent, setMinRent] = useState<number>(0);
  const [maxRent, setMaxRent] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);

  // Initial fetch
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      // fetch all properties
      const { data: propsData } = await supabase
        .from<PropertyType>("properties")
        .select("*");

      // fetch accepted matches
      const { data: matches } = await supabase
        .from("matches")
        .select("property_id")
        .eq("from_user", user.id)
        .eq("status", "accepted");

      const acceptedIds = new Set(matches?.map((m) => m.property_id));

      setAllProps(propsData || []);
      setMyListings((propsData || []).filter((p) => p.owner_id === user.id));
      setOtherListings((propsData || []).filter((p) => p.owner_id !== user.id));
      setMatchedListings(
        (propsData || []).filter((p) => acceptedIds.has(p.id))
      );
      setLoading(false);
    })();
  }, [user]);

  // Apply filters to "Other Properties"
  const applyFilters = () => {
    let result = allProps.filter((p) => p.owner_id !== user!.id);

    if (locFilter) {
      const lf = locFilter.toLowerCase();
      result = result.filter((p) =>
        p.location.toLowerCase().includes(lf)
      );
    }
    if (minSize) result = result.filter((p) => p.size_sf >= minSize);
    if (maxSize) result = result.filter((p) => p.size_sf <= maxSize);
    if (minRent) result = result.filter((p) => p.rent_per_sf >= minRent);
    if (maxRent) result = result.filter((p) => p.rent_per_sf <= maxRent);
    if (minPrice) result = result.filter((p) => p.price >= minPrice);
    if (maxPrice) result = result.filter((p) => p.price <= maxPrice);

    setOtherListings(result);
    router.push("/dashboard", undefined, { shallow: true });
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box px={6} pt={10} pb={20}>
        <Heading mb={2}>Welcome back!</Heading>
        <Text mb={6} color="gray.500">
          Discover and manage your commercial property listings.
        </Text>

        {/* Only "Post a Property" button here */}
        <Button
          colorScheme="teal"
          size="md"
          mb={10}
          onClick={() => router.push("/post-property")}
        >
          Post a Property
        </Button>

        <VStack spacing={12} align="start">
          <HorizontalPanel title="My Listings" data={myListings} />
          <HorizontalPanel title="Other Properties" data={otherListings} />
          <HorizontalPanel title="Matched Listings" data={matchedListings} />
        </VStack>
      </Box>

      {/* Drawer for Browse filters (triggered via sidebar) */}
      <Drawer
        isOpen={showBrowse}
        placement="right"
        size="sm"
        onClose={() => router.push("/dashboard", undefined, { shallow: true })}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Search Filters</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch" divider={<StackDivider />}>
              <FormControl>
                <FormLabel>Location Contains</FormLabel>
                <Input
                  value={locFilter}
                  onChange={(e) => setLocFilter(e.target.value)}
                  placeholder="e.g. New York"
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Min Size (SF)</FormLabel>
                  <NumberInput
                    value={minSize}
                    onChange={(_, v) => setMinSize(v)}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Max Size (SF)</FormLabel>
                  <NumberInput
                    value={maxSize}
                    onChange={(_, v) => setMaxSize(v)}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Min Rent ($/SF)</FormLabel>
                  <NumberInput
                    value={minRent}
                    onChange={(_, v) => setMinRent(v)}
                    precision={2}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Max Rent ($/SF)</FormLabel>
                  <NumberInput
                    value={maxRent}
                    onChange={(_, v) => setMaxRent(v)}
                    precision={2}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Min Price ($)</FormLabel>
                  <NumberInput
                    value={minPrice}
                    onChange={(_, v) => setMinPrice(v)}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Max Price ($)</FormLabel>
                  <NumberInput
                    value={maxPrice}
                    onChange={(_, v) => setMaxPrice(v)}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              <Button colorScheme="teal" onClick={applyFilters}>
                Apply Filters
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </DashboardLayout>
  );
}

function HorizontalPanel({
  title,
  data,
}: {
  title: string;
  data: PropertyType[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bg = useColorModeValue("white", "gray.800");

  const onMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const x = e.clientX - left;
    const pct = x / width;
    el.scrollLeft = pct * (el.scrollWidth - el.clientWidth);
  };

  return (
    <Box w="full">
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      <Text fontSize="sm" color="gray.500" mb={4}>
        {data.length} properties
      </Text>
      <Box
        ref={containerRef}
        onMouseMove={onMouseMove}
        display="flex"
        gap={6}
        overflowX="auto"
        overflowY="hidden"
        px={1}
        py={2}
        bg={bg}
        sx={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          WebkitOverflowScrolling: "touch",
        }}
      >
        {data.map((prop) => (
          <PropertyCard key={prop.id} property={prop} />
        ))}
      </Box>
    </Box>
  );
}