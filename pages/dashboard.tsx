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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useToast,
  Textarea,
  IconButton,
  Fade,
} from "@chakra-ui/react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";
import MyPropertyCard from "@/components/MyPropertyCard";
import OtherPropertyCard from "@/components/OtherPropertyCard";
import MatchedPropertyCard from "@/components/MatchedPropertyCard";
import DashboardSidebar from "@/components/DashboardSidebar";
import ChatbotUI from "@/components/ChatbotUI";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import { animate } from "framer-motion";

function useResponsiveHoverScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;

    function handleMove(e: MouseEvent) {
      if (e.buttons !== 0 && dragging) {
        el.scrollLeft -= e.movementX;
        return;
      }
      if (dragging) return;
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
    function handleDown() { dragging = true; }
    function handleUp() { dragging = false; }
    function handleLeave() { if (anim.current) anim.current.stop(); dragging = false; }
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mousedown", handleDown);
    el.addEventListener("mouseup", handleUp);
    el.addEventListener("mouseleave", handleLeave);

    // Touch support
    let touchStartX = 0;
    let scrollStart = 0;
    function onTouchStart(e: TouchEvent) {
      touchStartX = e.touches[0].clientX;
      scrollStart = el.scrollLeft;
    }
    function onTouchMove(e: TouchEvent) {
      const dx = touchStartX - e.touches[0].clientX;
      el.scrollLeft = scrollStart + dx;
    }
    el.addEventListener("touchstart", onTouchStart);
    el.addEventListener("touchmove", onTouchMove);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mousedown", handleDown);
      el.removeEventListener("mouseup", handleUp);
      el.removeEventListener("mouseleave", handleLeave);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      if (anim.current) anim.current.stop();
    };
  }, []);
  return ref;
}

export default function DashboardPage() {
  const { user, loading: uLoading } = useUser();
  const toast = useToast();
  const [myListings, setMy] = useState<any[]>([]);
  const [otherListings, setOther] = useState<any[]>([]);
  const [matched, setMatched] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejected, setRejected] = useState<string[]>([]);
  const [resetMessage, setResetMessage] = useState(false);

  // Popups and modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [propertyModal, setPropertyModal] = useState<any>(null);

  // Form state for posting
  const [newProp, setNewProp] = useState({
    title: "",
    location: "",
    price: 0,
    description: "",
    size_sf: 0,
    rent_per_sf: 0,
    monthly_rent: 0,
    image_url: "",
  });

  // Filters
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

  // Fetch everything
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // All properties
      const { data: all } = await supabase.from("properties").select("*");
      setMy(all!.filter((p) => p.owner_id === user.id));

      // Fetch matched property_ids
      const { data: matchedRows } = await supabase
        .from("matches")
        .select("id, property_id, properties(*)")
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .in("status", ["pending", "accepted"]);
      setMatched(
        (matchedRows ?? []).map((m) => ({
          matchId: m.id,
          property: m.properties ?? {},
        }))
      );
      const matchedPropertyIds = new Set((matchedRows ?? []).map((m) => m.property_id));

      // Fetch rejected property_ids
      const { data: rej } = await supabase
        .from("rejected_properties")
        .select("property_id")
        .eq("user_id", user.id);
      const rejectedIds = rej?.map((r) => r.property_id) ?? [];
      setRejected(rejectedIds);

      // Other properties = not my own, not matched, not rejected
      setOther(
        all!.filter(
          (p) =>
            p.owner_id !== user.id &&
            !matchedPropertyIds.has(p.id) &&
            !rejectedIds.includes(p.id)
        )
      );

      // Leases
      const { data: leasesData } = await supabase
        .from("leases")
        .select("*")
        .eq("user_id", user.id);
      setLeases(leasesData ?? []);

      setLoading(false);
      setResetMessage(false);
    })();
  }, [user]);

  // --- CYCLE BACK REJECTED IF NONE LEFT ---
  useEffect(() => {
    if (
      !loading &&
      user &&
      otherListings.length === 0 &&
      rejected.length > 0
    ) {
      // All listings are rejected, reset
      (async () => {
        await supabase
          .from("rejected_properties")
          .delete()
          .eq("user_id", user.id);
        setRejected([]);
        setResetMessage(true);
        // Refetch all properties
        const { data: all } = await supabase.from("properties").select("*");
        // You may want to refetch matched as well if possible
        setOther(
          all!.filter(
            (p) =>
              p.owner_id !== user.id &&
              !matched.some((m) => m.property.id === p.id)
          )
        );
      })();
    }
  }, [loading, user, otherListings.length, rejected.length]);

  // Handle Posting a property
  const handlePostProperty = async () => {
    setPosting(true);
    if (!user) return;

    const { error } = await supabase.from("properties").insert([
      {
        ...newProp,
        owner_id: user.id,
      },
    ]);
    setPosting(false);

    if (error) {
      toast({
        title: "Error posting property",
        description: error.message,
        status: "error",
      });
    } else {
      toast({ title: "Property posted!", status: "success" });
      setShowPostModal(false);
      setNewProp({
        title: "",
        location: "",
        price: 0,
        description: "",
        size_sf: 0,
        rent_per_sf: 0,
        monthly_rent: 0,
        image_url: "",
      });
      // Refetch
      if (user) {
        const { data: all } = await supabase.from("properties").select("*");
        setMy(all!.filter((p) => p.owner_id === user.id));
        setOther(all!.filter((p) => p.owner_id !== user.id));
      }
    }
  };

  // Filtering logic
  const filteredOther = otherListings.filter((p) => {
    if (
      filter.address &&
      !p.location?.toLowerCase().includes(filter.address.toLowerCase())
    )
      return false;
    if (
      filter.floor &&
      !String(p.description ?? "").toLowerCase().includes(filter.floor.toLowerCase())
    )
      return false;
    if (
      filter.suite &&
      !String(p.description ?? "").toLowerCase().includes(filter.suite.toLowerCase())
    )
      return false;
    if (filter.minSizeSF && ((p.size_sf ?? 0) < filter.minSizeSF)) return false;
    if (filter.maxSizeSF && ((p.size_sf ?? 0) > filter.maxSizeSF)) return false;
    if (filter.minRentPerSF && ((p.rent_per_sf ?? 0) < filter.minRentPerSF)) return false;
    if (filter.maxRentPerSF && ((p.rent_per_sf ?? 0) > filter.maxRentPerSF)) return false;
    return true;
  });

  // Animation-aware scroll refs
  const myListingsScroll = useResponsiveHoverScroll();
  const otherListingsScroll = useResponsiveHoverScroll();
  const matchedListingsScroll = useResponsiveHoverScroll();

  // Panel
  const panel = (
    title: string,
    count: number,
    children: React.ReactNode,
    scrollRef: any
  ) => (
    <Fade in={true}>
      <Box w="full" mb={10} position="relative">
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
    </Fade>
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
      {/* Sidebar */}
      <DashboardSidebar onBrowseClick={() => setShowFilterDrawer(true)} />

      {/* Main dashboard */}
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
        position="relative"
      >
        <Box display="flex" justifyContent="flex-end" mb={6}>
          <Button
            colorScheme="teal"
            onClick={() => setShowPostModal(true)}
            fontWeight="bold"
            px={7}
            py={2}
            shadow="md"
          >
            + Post a Property
          </Button>
        </Box>

        <Heading mb={2}>Welcome back!</Heading>
        <Text mb={8} color="gray.500">
          Like other people’s listings, accept incoming likes, then chat in real time.
        </Text>

        {resetMessage && (
          <Fade in={resetMessage}>
            <Box bg="yellow.100" borderRadius="md" p={3} mb={4} textAlign="center" fontWeight="medium">
              All listings cycled! Showing previously hidden properties again.
            </Box>
          </Fade>
        )}

        {panel(
          "My Listings",
          myListings.length,
          myListings.map((p) => <MyPropertyCard key={p.id} property={p} />),
          myListingsScroll
        )}

        {panel(
          "Other Properties",
          filteredOther.length,
          filteredOther.map((p) =>
            <OtherPropertyCard
              key={p.id}
              property={p}
              onClick={() => setPropertyModal(p)}
            />
          ),
          otherListingsScroll
        )}

        {panel(
          "Matched Listings",
          matched.length,
          matched.map(({ matchId, property }) => (
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
                  onChange={(e) => setFilter((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Any"
                />
              </FormControl>
              <Box display="flex" gap={4}>
                <FormControl>
                  <FormLabel>Floor</FormLabel>
                  <Input
                    value={filter.floor}
                    onChange={(e) => setFilter((f) => ({ ...f, floor: e.target.value }))}
                    placeholder="Any"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Suite</FormLabel>
                  <Input
                    value={filter.suite}
                    onChange={(e) => setFilter((f) => ({ ...f, suite: e.target.value }))}
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
                    onChange={(_, n) => setFilter((f) => ({ ...f, minSizeSF: n }))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Max Size (SF)</FormLabel>
                  <NumberInput
                    value={filter.maxSizeSF}
                    min={0}
                    onChange={(_, n) => setFilter((f) => ({ ...f, maxSizeSF: n }))}
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
                    onChange={(_, n) => setFilter((f) => ({ ...f, minRentPerSF: n }))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Max Rent ($/SF/Yr)</FormLabel>
                  <NumberInput
                    value={filter.maxRentPerSF}
                    min={0}
                    onChange={(_, n) => setFilter((f) => ({ ...f, maxRentPerSF: n }))}
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

      {/* --- Post a Property Modal --- */}
      <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Post a Property</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={newProp.title}
                                    onChange={e => setNewProp({ ...newProp, title: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Location</FormLabel>
                <Input
                  value={newProp.location}
                  onChange={e => setNewProp({ ...newProp, location: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newProp.description}
                  onChange={e => setNewProp({ ...newProp, description: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Price</FormLabel>
                <NumberInput
                  value={newProp.price}
                  min={0}
                  onChange={(_, n) => setNewProp({ ...newProp, price: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Size (SF)</FormLabel>
                <NumberInput
                  value={newProp.size_sf}
                  min={0}
                  onChange={(_, n) => setNewProp({ ...newProp, size_sf: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Rent Per SF</FormLabel>
                <NumberInput
                  value={newProp.rent_per_sf}
                  min={0}
                  onChange={(_, n) => setNewProp({ ...newProp, rent_per_sf: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Monthly Rent</FormLabel>
                <NumberInput
                  value={newProp.monthly_rent}
                  min={0}
                  onChange={(_, n) => setNewProp({ ...newProp, monthly_rent: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              {/* TODO: Add image upload if needed */}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowPostModal(false)} mr={3}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              isLoading={posting}
              onClick={handlePostProperty}
            >
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- Property Detail Modal (for OtherPropertyCard) --- */}
      {propertyModal && (
        <PropertyDetailModal
          property={propertyModal}
          onClose={() => setPropertyModal(null)}
          user={user}
          onLike={async () => {
            // Insert into matches (from_user: current user, to_user: property owner)
            const { error } = await supabase.from("matches").insert([
              {
                from_user: user.id,
                to_user: propertyModal.owner_id,
                property_id: propertyModal.id,
                status: "pending",
              },
            ]);
            if (error) {
              toast({
                title: "Error liking property",
                description: error.message,
                status: "error",
              });
            } else {
              toast({ title: "You liked this property!", status: "success" });
              setPropertyModal(null);
              setOther((list) => list.filter((p) => p.id !== propertyModal.id));
            }
          }}
          onCancel={async () => {
            // Add to rejected_properties
            const { error } = await supabase.from("rejected_properties").insert([
              { user_id: user.id, property_id: propertyModal.id }
            ]);
            if (error) {
              toast({
                title: "Error rejecting property",
                description: error.message,
                status: "error",
              });
            } else {
              toast({ title: "Listing hidden!", status: "info" });
              setPropertyModal(null);
              setOther((list) => list.filter((p) => p.id !== propertyModal.id));
              setRejected((rej) => [...rej, propertyModal.id]);
            }
          }}
          onUndo={async () => {
            // Remove from rejected_properties
            const { error } = await supabase
              .from("rejected_properties")
              .delete()
              .eq("user_id", user.id)
              .eq("property_id", propertyModal.id);
            if (error) {
              toast({
                title: "Undo failed",
                description: error.message,
                status: "error",
              });
            } else {
              toast({ title: "Undo successful!", status: "success" });
              setPropertyModal(null);
              // Optionally re-add to otherListings by refetching or manual logic
              // For demo: just refetch all properties
              const { data: all } = await supabase.from("properties").select("*");
              setOther(
                all!.filter(
                  (p) =>
                    p.owner_id !== user.id &&
                    !matched.some((m) => m.property.id === p.id) &&
                    !rejected.includes(p.id)
                )
              );
            }
          }}
          isRejected={rejected.includes(propertyModal.id)}
        />
      )}
    </Box>
  );
}