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
} from "@chakra-ui/react";
import { supabase } from "@/lib/supabaseClient";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie, Doughnut } from "react-chartjs-2";

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
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [financials, setFinancials] = useState<{ totalRent: number; avgRent: number }>({
    totalRent: 0,
    avgRent: 0,
  });

  useEffect(() => {
    (async () => {
      // Check admin auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.email !== "admin@example.com") {
        router.replace("/dashboard");
        return;
      }

      // Load data for analytics
      const { data: userRows } = await supabase.from("users").select("*");
      const { data: propertyRows } = await supabase.from("properties").select("*");
      const { data: matchRows } = await supabase.from("matches").select("*");

      setUsers(userRows || []);
      setProperties(propertyRows || []);
      setMatches(matchRows || []);

      // Simple financials (total/avg rent)
      const totalRent =
        propertyRows?.reduce((sum, p) => sum + (Number(p.monthly_rent) || 0), 0) || 0;
      const avgRent = propertyRows && propertyRows.length ? totalRent / propertyRows.length : 0;
      setFinancials({ totalRent, avgRent });

      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <Flex h="100vh" justify="center" align="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  // Analytics: Diversity by property type and location
  const typeCounts: { [k: string]: number } = {};
  const locationCounts: { [k: string]: number } = {};
  properties.forEach((p) => {
    if (p.type) typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
    if (p.location) locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
  });

  // Analytics: User signups over time (simple, by created_at month)
  const signupCounts: { [month: string]: number } = {};
  users.forEach((u) => {
    const d = u.created_at ? new Date(u.created_at) : null;
    if (!d) return;
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    signupCounts[month] = (signupCounts[month] || 0) + 1;
  });

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
    <Box p={[2, 6]} maxW="1100px" mx="auto">
      <Heading mb={6}>CREB.Ai Admin Dashboard</Heading>
      <SimpleGrid columns={[1, 2, 4]} spacing={6} mb={8}>
        <Stat>
          <StatLabel>Total Users</StatLabel>
          <StatNumber>{users.length}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Total Listings</StatLabel>
          <StatNumber>{properties.length}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Total Matches</StatLabel>
          <StatNumber>{matches.length}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Total Monthly Rent</StatLabel>
          <StatNumber>${financials.totalRent.toLocaleString()}</StatNumber>
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

      <Box bg="gray.50" p={5} borderRadius="xl" mb={8}>
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
    </Box>
  );
}