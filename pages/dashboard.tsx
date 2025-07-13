import { useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  Button,
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
import MyPropertyCard from "@/components/MyPropertyCard";
import OtherPropertyCard from "@/components/OtherPropertyCard";
import MatchedPropertyCard from "@/components/MatchedPropertyCard";
import DashboardSidebar from "@/components/DashboardSidebar";
import ChatbotUI from "@/components/ChatbotUI";
import { animate } from "framer-motion";

// Mouse-follow horizontal scroll
function useResponsiveHoverScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleMove(e: MouseEvent) {
      if (e.buttons !== 0) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const maxScroll = el.scrollWidth - el.clientWidth;
      const targetScroll = percent * maxScroll;
      if (anim.current) anim.current.stop();
      anim.current = animate(el.scrollLeft, targetScroll, {
        type: "tween",
        duration: 0.22,
        onUpdate: v => { el.scrollLeft = v; },
      });
    }

    function handleLeave() {
      if (anim.current) anim.current.stop();
    }

    if (window.matchMedia("(pointer: fine)").matches) {
      el.addEventListener("mousemove", handleMove);
      el.addEventListener("mouseleave", handleLeave);
    }

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      if (anim.current) anim.current.stop();
    };
  }, []);

  return ref;
}

export default function DashboardPage() {
  const { user, loading: uLoading } = useUser();
  const [myListings, setMy] = useState<any[]>([]);
  const [otherListings, setOther] = useState<any[]>([]);
  const [matched, setMatched] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [showAIDrawer, setShowAIDrawer] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // All properties
      const { data: all } = await supabase.from("properties").select("*");
      setMy(all!.filter((p) => p.owner_id === user.id));
      setOther(all!.filter((p) => p.owner_id !== user.id));

      // Matches
      const { data: mk } = await supabase
        .from("matches")
        .select("id, property_id, properties(*)")
        .eq("from_user", user.id)
        .eq("status", "accepted");
      setMatched(mk!.map((m) => ({ matchId: m.id, property: m.properties })));

      // Leases (if you have a 'leases' table; adjust if your schema differs)
      const { data: leasesData } = await supabase
        .from("leases")
        .select("*")
        .eq("user_id", user.id);
      setLeases(leasesData ?? []);

      setLoading(false);
    })();
  }, [user]);

  const handleFilterChange = (key, value) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

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

  // Responsive hover scroll refs
  const myListingsScroll = useResponsiveHoverScroll();
  const otherListingsScroll = useResponsiveHoverScroll();
  const matchedListingsScroll = useResponsiveHoverScroll();

  const panel = (
    title: string,
    count: number,
    children: React.ReactNode,
    scrollRef
  ) => (
    <Box w="full" mb={10}>
      <Heading size="md" mb={2}>{title}</Heading>
      <Text color="gray.500" mb={2}>
        {count} properties
      </Text>
      <Box
        ref={scrollRef}
        position="relative"
        overflowX="auto"
        display="flex"
        sx={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          cursor: "pointer",
          userSelect: "none",
          py: 2,
          gap: "1.5rem",
        }}
        onPointerDown={e => e.currentTarget.focus()}
      >
        {children}
      </Box>
    </Box>
  );

  if (uLoading || loading) {
    return (
      <Box display="flex" minH="100vh">
        <DashboardSidebar onBrowseClick={() => setShowFilterDrawer(true)} />
        <Box flex="1" display="flex" alignItems="center" justifyContent="center">
          <Spinner size="xl" />
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      {/* Sidebar: fixed, not scrollable */}
      <DashboardSidebar onBrowseClick={() => setShowFilterDrawer(true)} />

      {/* Main dashboard: vertical scroll, panels stacked */}
      <Box
        flex="1"
        maxHeight="100vh"
        overflowY="auto"
        sx={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
        py={10}
        px={{ base: 2, md: 10 }}
      >
        <Heading mb={2}>Welcome back!</Heading>
        <Text mb={8} color="gray.500">
          Like other people’s listings, accept incoming likes, then chat in real time.
        </Text>
        {panel(
          "My Listings",
          myListings.length,
          myListings.map((p) => <MyPropertyCard key={p.id} property={p} />),
          myListingsScroll
        )}
        {panel(
          "Other Properties",
          filteredOther.length,
          filteredOther.map((p) => <OtherPropertyCard key={p.id} property={p} />),
          otherListingsScroll
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
          )),
          matchedListingsScroll
        )}
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
              <Box display="flex" gap={4}>
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
              </Box>
              <Box display="flex" gap={4}>
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
              </Box>
              <Box display="flex" gap={4}>
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
              </Box>
              <Button colorScheme="teal" onClick={() => setShowFilterDrawer(false)}>
                Apply Filters
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* --- AI Chatbot Sidebar --- */}
      <Drawer
        isOpen={showAIDrawer}
        placement="right"
        size="md"
        onClose={() => setShowAIDrawer(false)}
      >
        <DrawerOverlay />
        <DrawerContent display="flex" flexDirection="column">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">CREB.Ai Assistant</DrawerHeader>
          <DrawerBody p={0} display="flex" flexDirection="column" height="100%">
            <ChatbotUI
              user={user}
              listings={myListings}
              matches={matched}
              leases={leases}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Floating AI button */}
      <Box
        position="fixed"
        bottom={{ base: 6, md: 10 }}
        right={{ base: 6, md: 10 }}
        zIndex={2000}
      >
        <Button
          borderRadius="full"
          boxSize="60px"
          colorScheme="teal"
          shadow="lg"
          fontSize="2xl"
          onClick={() => setShowAIDrawer(true)}
        >
          🤖
        </Button>
      </Box>
    </Box>
  );
}