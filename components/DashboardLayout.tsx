import {
  Box,
  VStack,
  Heading,
  Text,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiHome,
  FiSearch,
  FiRadio,
  FiList,
  FiHeart,
  FiUser,
} from "react-icons/fi";
import { useRouter } from "next/router";
import React from "react";

const sidebarItems = [
  { icon: FiHome, label: "Home", path: "/dashboard" },
  { icon: FiSearch, label: "Browse", path: "/dashboard?showSearch=true" }, // search handled in dashboard
  { icon: FiRadio, label: "Live Deals", path: "/live-deals" },
  { section: "My Library" },
  { icon: FiList, label: "My Listings", path: "/my-listings" },
  { icon: FiHeart, label: "Matches", path: "/matches" },
  { icon: FiUser, label: "Profile", path: "/profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const bg = useColorModeValue("gray.50", "gray.900");

  return (
    <Box minH="100vh" bg={bg} display="flex">
      {/* Sidebar */}
      <Box w="250px" p={6} bg="black" color="white" minH="100vh">
        <Heading size="md" mb={10} fontWeight="bold">
          CREB.Ai
        </Heading>
        <VStack align="start" spacing={5} fontWeight="medium" width="100%">
          {sidebarItems.map((item, index) =>
            item.section ? (
              <Text
                key={index}
                fontSize="sm"
                color="gray.400"
                mt={4}
                width="100%"
              >
                {item.section}
              </Text>
            ) : (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={router.pathname === item.path}
                onClick={() =>
                  item.label === "Browse"
                    ? router.push("/dashboard?showSearch=true")
                    : router.push(item.path)
                }
              />
            )
          )}
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={10}>
        {children}
      </Box>
    </Box>
  );
}

function SidebarItem({
  icon,
  label,
  path,
  isActive,
  onClick,
}: {
  icon: any;
  label: string;
  path: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <HStack
      spacing={3}
      cursor="pointer"
      onClick={onClick}
      _hover={{ color: "teal.300" }}
      color={isActive ? "teal.300" : "white"}
      width="100%"
    >
      <Box as={icon} boxSize={5} />
      <Text fontSize="md">{label}</Text>
    </HStack>
  );
}