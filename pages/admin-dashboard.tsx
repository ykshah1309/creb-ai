import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Spinner,
  Text,
  VStack,
  Flex,
  Button,
  HStack,
  Avatar,
  Tag,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Divider,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { supabase } from "@/lib/supabaseClient";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import { FiCheckCircle, FiXCircle, FiLogOut } from "react-icons/fi";

// Chart.js registration
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [pendingVerification, setPendingVerification] = useState<any[]>([]);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [financials, setFinancials] = useState({ totalRent: 0, avgRent: 0 });
  const [activeUsers, setActiveUsers] = useState(0);

  // --- LOAD DATA ---
  useEffect(() => {
    (async () => {
      // 1. Admin auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "admin@example.com") {
        router.replace("/dashboard");
        return;
      }
      // 2. Load all major datasets
      const { data: userRows } = await supabase.from("users").select("*");
      const { data: propertyRows } = await supabase.from("properties").select("*");
      const { data: matchRows } = await supabase.from("matches").select("*");
      setUsers(userRows || []);
      setProperties(propertyRows || []);
      setMatches(matchRows || []);
      // 3. Pending verifications
      setPendingVerification((propertyRows || []).filter(
        (p) => p.verification_status === "pending"
      ));
      // 4. Financials
      const totalRent = propertyRows?.reduce((sum, p) => sum + (Number(p.monthly_rent) || 0), 0) || 0;
      const avgRent = propertyRows && propertyRows.length ? totalRent / propertyRows.length : 0;
      setFinancials({ totalRent, avgRent });
      // 5. Active users (last 30 days)
      const now = new Date();
      const active = (userRows || []).filter(u => {
        if (!u.last_login) return false;
        const d = new Date(u.last_login);
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) < 30;
      }).length;
      setActiveUsers(active);
      setLoading(false);
    })();
  }, [router]);

  // --- APPROVE/REJECT VERIFICATION ---
  async function handleApprove(id: string) {
    setApproving(id);
    const { error } = await supabase
      .from("properties")
      .update({ verification_status: "approved", is_verified: true })
      .eq("id", id);
    setApproving(null);
    if (error) {
      toast({
        title: "Failed to approve",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } else {
      toast({ title: "Property verified!", status: "success" });
      setPendingVerification(prev => prev.filter(p => p.id !== id));
      setProperties(props => props.map(p => (p.id === id ? { ...p, verification_status: "approved", is_verified: true } : p)));
    }
  }
  async function handleReject(id: string) {
    setRejecting(id);
    const { error } = await supabase
      .from("properties")
      .update({ verification_status: "rejected", is_verified: false })
      .eq("id", id);
    setRejecting(null);
    if (error) {
      toast({
        title: "Failed to reject",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } else {
      toast({ title: "Verification rejected.", status: "info" });
      setPendingVerification(prev => prev.filter(p => p.id !== id));
      setProperties(props => props.map(p => (p.id === id ? { ...p, verification_status: "rejected", is_verified: false } : p)));
    }
  }

  // --- LOGOUT ---
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) {
    return (
      <Flex h="100vh" justify="center" align="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  // --- Analytics Data ---
  const typeCounts: { [k: string]: number } = {};
  const locationCounts: { [k: string]: number } = {};
  properties.forEach((p) => {
    if (p.type) typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
    if (p.location) locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
  });

  // Signup/month
  const signupCounts: { [month: string]: number } = {};
  users.forEach((u) => {
    const d = u.created_at ? new Date(u.created_at) : null;
    if (!d) return;
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    signupCounts[month] = (signupCounts[month] || 0) + 1;
  });

  // Verification conversion rate
  const verifiedCount = properties.filter(p => p.is_verified || p.verification_status === "approved").length;
  const requestedCount = properties.filter(p => p.verification_status === "pending" || p.verification_status === "approved").length;

  // Most popular locations
  const sortedLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top rent listings
  const topListings = [...properties]
    .sort((a, b) => (b.monthly_rent || 0) - (a.monthly_rent || 0))
    .slice(0, 5);

  // Chart Data
  const typePieData = {
    labels: Object.keys(typeCounts),
    datasets: [
      {
        label: "Listings by Type",
        data: Object.values(typeCounts),
        backgroundColor: ["#4299e1", "#38a169", "#ed8936", "#f6e05e", "#e53e3e", "#805ad5"],
      },
    ],
  };
  const locationPieData = {
    labels: Object.keys(locationCounts),
    datasets: [
      {
        label: "Listings by Location",
        data: Object.values(locationCounts),
        backgroundColor: ["#63b3ed", "#68d391", "#faad63", "#faf089", "#fc8181", "#b794f4"],
      },
    ],
  };
  const signupBarData = {
    labels: Object.keys(signupCounts),
    datasets: [
      {
        label: "User Signups (per month)",
        data: Object.values(signupCounts),
        backgroundColor: "#3182ce",
      },
    ],
  };

  return (
    <Box p={[2, 6]} maxW="1200px" mx="auto" minH="100vh" bg="gray.50">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>CREB.Ai Admin Dashboard</Heading>
        <Button leftIcon={<FiLogOut />} colorScheme="red" onClick={handleLogout}>
          Logout
        </Button>
      </Flex>

      <SimpleGrid columns={[1, 2, 4]} spacing={6} mb={8}>
        <Stat bg="white" rounded="xl" p={4} shadow="md">
          <StatLabel>Total Users</StatLabel>
          <StatNumber>{users.length}</StatNumber>
        </Stat>
        <Stat bg="white" rounded="xl" p={4} shadow="md">
          <StatLabel>Active Users (30d)</StatLabel>
          <StatNumber>{activeUsers}</StatNumber>
        </Stat>
        <Stat bg="white" rounded="xl" p={4} shadow="md">
          <StatLabel>Total Listings</StatLabel>
          <StatNumber>{properties.length}</StatNumber>
        </Stat>
        <Stat bg="white" rounded="xl" p={4} shadow="md">
          <StatLabel>Total Matches</StatLabel>
          <StatNumber>{matches.length}</StatNumber>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={[1, 2]} spacing={8} mb={10}>
        <Box bg="white" boxShadow="lg" p={4} borderRadius="xl">
          <Heading as="h3" fontSize="xl" mb={3}>
            Listing Diversity (by Type)
          </Heading>
          <Pie key="pie-type" data={typePieData} />
        </Box>
        <Box bg="white" boxShadow="lg" p={4} borderRadius="xl">
          <Heading as="h3" fontSize="xl" mb={3}>
            Listing Diversity (by Location)
          </Heading>
          <Doughnut key="doughnut-location" data={locationPieData} />
        </Box>
      </SimpleGrid>

      <Box bg="white" boxShadow="lg" p={4} borderRadius="xl" mb={10}>
        <Heading as="h3" fontSize="xl" mb={3}>
          User Signups Over Time
        </Heading>
        <Bar key="bar-signup" data={signupBarData} />
      </Box>

      <SimpleGrid columns={[1, 2]} spacing={8} mb={10}>
        <Box bg="white" p={5} borderRadius="xl" boxShadow="md">
          <Heading as="h3" fontSize="xl" mb={2}>
            Financial Summary
          </Heading>
          <VStack align="start" spacing={1}>
            <Text>
              <b>Average Monthly Rent:</b> ${financials.avgRent.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
            <Text>
              <b>Total Monthly Rent (all listings):</b> ${financials.totalRent.toLocaleString()}
            </Text>
            <Text color="gray.600" fontSize="sm">
              * based on all listings in the database
            </Text>
          </VStack>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" boxShadow="md">
          <Heading as="h3" fontSize="xl" mb={2}>
            Popular Locations
          </Heading>
          <VStack align="start" spacing={1}>
            {sortedLocations.map(([loc, count]) => (
              <Text key={loc}>
                <b>{loc}</b>: {count} listings
              </Text>
            ))}
          </VStack>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={[1, 2]} spacing={8} mb={10}>
        <Box bg="white" p={5} borderRadius="xl" boxShadow="md">
          <Heading as="h3" fontSize="xl" mb={2}>
            Top Listings by Rent
          </Heading>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Location</Th>
                <Th isNumeric>Monthly Rent</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {topListings.map((p) => (
                <Tr key={p.id}>
                  <Td>{p.title}</Td>
                  <Td>{p.location}</Td>
                  <Td isNumeric>${p.monthly_rent}</Td>
                  <Td>
                    {p.is_verified || p.verification_status === "approved" ? (
                      <Badge colorScheme="teal">Verified</Badge>
                    ) : p.verification_status === "pending" ? (
                      <Badge colorScheme="yellow">Pending</Badge>
                    ) : (
                      <Badge colorScheme="gray">Not Verified</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" boxShadow="md">
          <Heading as="h3" fontSize="xl" mb={2}>
            Verification Conversion Rate
          </Heading>
          <VStack align="start" spacing={1}>
            <Text>
              <b>Requested:</b> {requestedCount}
            </Text>
            <Text>
              <b>Verified:</b> {verifiedCount}
            </Text>
            <Text>
              <b>Conversion Rate:</b>{" "}
              {requestedCount
                ? ((verifiedCount / requestedCount) * 100).toFixed(1)
                : "0"}
              %
            </Text>
          </VStack>
        </Box>
      </SimpleGrid>

      <Divider my={8} />
      <Box bg="white" boxShadow="lg" p={5} borderRadius="xl">
        <Heading as="h3" fontSize="xl" mb={4}>
          Property Verification Requests
        </Heading>
        {pendingVerification.length === 0 ? (
          <Text color="gray.500">No verification requests pending.</Text>
        ) : (
          <Table size="md" variant="simple">
            <Thead>
              <Tr>
                <Th>Listing</Th>
                <Th>Owner</Th>
                <Th>Location</Th>
                <Th>Requested</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingVerification.map((p) => {
                const owner = users.find((u) => u.id === p.owner_id);
                return (
                  <Tr key={p.id}>
                    <Td>
                      <HStack spacing={3}>
                        <Avatar src={p.image_url} size="sm" />
                        <Box>
                          <Text fontWeight="bold">{p.title}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {p.description?.slice(0, 32)}...
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Avatar size="xs" src={owner?.avatar_url} />
                        <Text>{owner?.name || "Unknown"}</Text>
                      </HStack>
                    </Td>
                    <Td>{p.location}</Td>
                    <Td>
                      {p.verification_requested_at
                        ? new Date(p.verification_requested_at).toLocaleString()
                        : "-"}
                    </Td>
                    <Td>
                      <Badge colorScheme="yellow">Pending</Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <IconButton
                          colorScheme="teal"
                          size="sm"
                          aria-label="Approve"
                          icon={<FiCheckCircle />}
                          isLoading={approving === p.id}
                          onClick={() => handleApprove(p.id)}
                        />
                        <IconButton
                          colorScheme="red"
                          size="sm"
                          aria-label="Reject"
                          icon={<FiXCircle />}
                          isLoading={rejecting === p.id}
                          onClick={() => handleReject(p.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Box>
      <Box h={16} /> {/* padding bottom */}
    </Box>
  );
}