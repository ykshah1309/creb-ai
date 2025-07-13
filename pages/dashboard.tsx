import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
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
  Button,
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
  const router = useRouter();
  const showFilters = router.query.mode === "browse";

  const [allProps, setAllProps] = useState<PropertyType[]>([]);
  const [myListings, setMyListings] = useState<PropertyType[]>([]);
  const [otherListings, setOtherListings] = useState<PropertyType[]>([]);
  const [matchedListings, setMatchedListings] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [locFilter, setLocFilter] = useState("");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [minSize, setMinSize]   = useState<number>(0);
  const [maxSize, setMaxSize]   = useState<number>(0);

  // initial data fetch
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const { data: propsData } = await supabase.from<PropertyType>("properties").select("*");
      const { data: matches }  = await supabase
        .from("matches")
        .select("property_id")
        .eq("from_user", user.id)
        .eq("status", "accepted");
      const acceptedIds = new Set(matches?.map((m) => m.property_id));

      setAllProps(propsData || []);
      setMyListings((propsData || []).filter((p) => p.owner_id === user.id));
      setMatchedListings((propsData || []).filter((p) => acceptedIds.has(p.id)));
      setLoading(false);
    })();
  }, [user]);

  // apply filters client-side
  useEffect(() => {
    let c = allProps.filter((p) => p.owner_id !== user!.id);

    if (locFilter) {
      const term = locFilter.toLowerCase();
      c = c.filter((p) => p.location.toLowerCase().includes(term));
    }
    if (minPrice) c = c.filter((p) => p.price >= minPrice);
    if (maxPrice) c = c.filter((p) => p.price <= maxPrice);
    if (minSize)  c = c.filter((p) => (p.size_sf || 0) >= minSize);
    if (maxSize)  c = c.filter((p) => (p.size_sf || 0) <= maxSize);

    setOtherListings(c);
  }, [allProps, locFilter, minPrice, maxPrice, minSize, maxSize, user]);

  // close drawer
  const closeFilters = () => {
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
      <Box px={6} pt={10} pb={20} overflowX="hidden">
        <Heading fontSize="3xl" mb={2}>Welcome back!</Heading>
        <Text fontSize="lg" mb={6} color="gray.500">
          Discover and manage your commercial property listings.
        </Text>

        <VStack spacing={12} align="start">
          <HorizontalPanel title="My Listings"    data={myListings} />
          <HorizontalPanel title="Other Properties" data={otherListings} />
          <HorizontalPanel title="Matched Listings" data={matchedListings} />
        </VStack>
      </Box>

      {/* Filter Drawer (opened via sidebar “Browse”) */}
      <Drawer isOpen={showFilters} placement="right" size="sm" onClose={closeFilters}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Search & Filters</DrawerHeader>
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
                  <FormLabel>Min Price</FormLabel>
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
                  <FormLabel>Max Price</FormLabel>
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

              <Button colorScheme="teal" onClick={closeFilters}>
                Close & Apply
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
    el.scrollLeft = (x / width) * (el.scrollWidth - el.clientWidth);
  };

  return (
    <Box w="full">
      <Heading size="md" mb={2}>{title}</Heading>
      <Text fontSize="sm" color="gray.500" mb={4}>{data.length} properties</Text>
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