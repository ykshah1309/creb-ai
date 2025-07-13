import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  Button,
  HStack,
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
} from "@chakra-ui/react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";
import OtherPropertyCard from "@/components/OtherPropertyCard";
import MyPropertyCard from "@/components/MyPropertyCard";
import MatchedPropertyCard from "@/components/MatchedPropertyCard";

export default function DashboardPage() {
  const { user, loading: uLoading } = useUser();
  const [myListings, setMy] = useState<any[]>([]);
  const [otherListings, setOther] = useState<any[]>([]);
  const [matched, setMatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FILTER STATE ---
  const [filter, setFilter] = useState({
    address: "",
    floor: "",
    suite: "",
    minSizeSF: 0,
    maxSizeSF: 0,
    minRentPerSF: 0,
    maxRentPerSF: 0,
  });
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // --- DATA FETCH ---
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: all } = await supabase.from("properties").select("*");
      const { data: mk } = await supabase
        .from("matches")
        .select("id, property_id, properties(*)")
        .eq("from_user", user.id)
        .eq("status", "accepted");
      setMy(all!.filter((p) => p.owner_id === user.id));
      setOther(all!.filter((p) => p.owner_id !== user.id));
      setMatched(mk!.map((m) => ({ matchId: m.id, property: m.properties })));
      setLoading(false);
    })();
  }, [user]);

  // --- FILTER HANDLER ---
  const handleFilterChange = (key, value) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  // --- FILTERED ARRAYS ---
  const filteredOther = otherListings.filter((p) => {
    if (
      filter.address &&
      !p.address?.toLowerCase().includes(filter.address.toLowerCase())
    )
      return false;
    if (filter.floor && !String(p.floor ?? p.description ?? "").includes(filter.floor))
      return false;
    if (filter.suite && !String(p.suite ?? p.description ?? "").includes(filter.suite))
      return false;
    if (
      filter.minSizeSF &&
      ((p.size_sf ?? p.sizeSF ?? 0) < filter.minSizeSF)
    )
      return false;
    if (
      filter.maxSizeSF &&
      ((p.size_sf ?? p.sizeSF ?? 0) > filter.maxSizeSF)
    )
      return false;
    if (
      filter.minRentPerSF &&
      ((p.rent_per_sf ?? p.rentPerSF ?? 0) < filter.minRentPerSF)
    )
      return false;
    if (
      filter.maxRentPerSF &&
      ((p.rent_per_sf ?? p.rentPerSF ?? 0) > filter.maxRentPerSF)
    )
      return false;
    return true;
  });

  const filteredMatched = matched.filter(({ property: p }) => {
    if (
      filter.address &&
      !p.address?.toLowerCase().includes(filter.address.toLowerCase())
    )
      return false;
    if (filter.floor && !String(p.floor ?? p.description ?? "").includes(filter.floor))
      return false;
    if (filter.suite && !String(p.suite ?? p.description ?? "").includes(filter.suite))
      return false;
    if (
      filter.minSizeSF &&
      ((p.size_sf ?? p.sizeSF ?? 0) < filter.minSizeSF)
    )
      return false;
    if (
      filter.maxSizeSF &&
      ((p.size_sf ?? p.sizeSF ?? 0) > filter.maxSizeSF)
    )
      return false;
    if (
      filter.minRentPerSF &&
      ((p.rent_per_sf ?? p.rentPerSF ?? 0) < filter.minRentPerSF)
    )
      return false;
    if (
      filter.maxRentPerSF &&
      ((p.rent_per_sf ?? p.rentPerSF ?? 0) > filter.maxRentPerSF)
    )
      return false;
    return true;
  });

  // --- PANEL RENDER ---
  const panel = (title: string, count: number, children: React.ReactNode) => (
    <Box w="full">
      <Heading size="md">{title}</Heading>
      <Text color="gray.500" mb={2}>
        {count} properties
      </Text>
      <HStack
        spacing={6}
        overflowX="auto"
        sx={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
        py={2}
      >
        {children}
      </HStack>
    </Box>
  );

  // --- MAIN RENDER ---
  if (uLoading || loading) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onBrowseClick={() => setShowFilterDrawer(true)}>
      <Box px={6} py={10} overflowX="hidden">
        <Heading>Welcome back!</Heading>
        <Text mb={6} color="gray.500">
          Like other people’s listings, accept incoming likes, then chat in real time.
        </Text>
        <VStack spacing={12} align="start">
          {panel(
            "My Listings",
            myListings.length,
            myListings.map((p) => <MyPropertyCard key={p.id} property={p} />)
          )}
          {panel(
            "Other Properties",
            filteredOther.length,
            filteredOther.map((p) => <OtherPropertyCard key={p.id} property={p} />)
          )}
          {panel(
            "Matched Listings",
            filteredMatched.length,
            filteredMatched.map(({ matchId, property }) => (
              <MatchedPropertyCard
                key={matchId}
                property={property}
                matchId={matchId}
              />
            ))
          )}
        </VStack>
      </Box>

      {/* --- RIGHT FILTER DRAWER --- */}
      <Drawer
        isOpen={showFilterDrawer}
        placement="right"
        onClose={() => setShowFilterDrawer(false)}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filter Listings</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Input
                  value={filter.address}
                  onChange={(e) => handleFilterChange("address", e.target.value)}
                  placeholder="Any"
                />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Floor</FormLabel>
                  <Input
                    value={filter.floor}
                    onChange={(e) => handleFilterChange("floor", e.target.value)}
                    placeholder="Any"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Suite</FormLabel>
                  <Input
                    value={filter.suite}
                    onChange={(e) => handleFilterChange("suite", e.target.value)}
                    placeholder="Any"
                  />
                </FormControl>
              </HStack>
              <HStack>
                <FormControl>
                  <FormLabel>Min Size (SF)</FormLabel>
                  <NumberInput
                    value={filter.minSizeSF}
                    min={0}
                    onChange={(_, n) => handleFilterChange("minSizeSF", n)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Max Size (SF)</FormLabel>
                  <NumberInput
                    value={filter.maxSizeSF}
                    min={0}
                    onChange={(_, n) => handleFilterChange("maxSizeSF", n)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              <HStack>
                <FormControl>
                  <FormLabel>Min Rent ($/SF/Yr)</FormLabel>
                  <NumberInput
                    value={filter.minRentPerSF}
                    min={0}
                    onChange={(_, n) => handleFilterChange("minRentPerSF", n)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Max Rent ($/SF/Yr)</FormLabel>
                  <NumberInput
                    value={filter.maxRentPerSF}
                    min={0}
                    onChange={(_, n) => handleFilterChange("maxRentPerSF", n)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              <Button colorScheme="teal" onClick={() => setShowFilterDrawer(false)}>
                Apply Filters
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </DashboardLayout>
  );
}