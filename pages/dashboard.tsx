// pages/dashboard.tsx
import { useEffect, useState } from "react";
import { Box, Heading, Text, Spinner, VStack, useColorModeValue, Button, HStack } from "@chakra-ui/react";
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

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // fetch all properties
      const { data: all } = await supabase.from("properties").select("*");
      // fetch “accepted” matches initiated by me
      const { data: mk } = await supabase
        .from("matches")
        .select("id, property_id, properties(*)")
        .eq("from_user", user.id)
        .eq("status", "accepted");
      // partition
      setMy(all!.filter((p) => p.owner_id === user.id));
      setOther(all!.filter((p) => p.owner_id !== user.id));
      // build matched array with matchId + property object
      setMatched(mk!.map((m) => ({ matchId: m.id, property: m.properties })));
      setLoading(false);
    })();
  }, [user]);

  if (uLoading || loading) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

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

  return (
    <DashboardLayout>
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
            otherListings.length,
            otherListings.map((p) => <OtherPropertyCard key={p.id} property={p} />)
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
            ))
          )}
        </VStack>
      </Box>
    </DashboardLayout>
  );
}