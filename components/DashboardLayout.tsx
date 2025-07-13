// components/DashboardLayout.tsx
import {
  Flex,
  Box,
  Heading,
  VStack,
  Text,
  HStack,
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
import Link from "next/link";
import type { IconType } from "react-icons";

interface SidebarItemProps {
  href: string;
  icon: IconType;
  label: string;
}

function SidebarItem({ href, icon: Icon, label }: SidebarItemProps) {
  return (
    <Link href={href} passHref>
      <HStack
        as="a"
        spacing={3}
        p={2}
        borderRadius="md"
        _hover={{ bg: "teal.600" }}
        transition="background 0.2s"
        cursor="pointer"
      >
        <Icon />
        <Text>{label}</Text>
      </HStack>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bg = useColorModeValue("gray.50", "gray.900");
  return (
    <Flex h="100vh" overflow="hidden">
      {/* Sidebar: never scrolls */}
      <Box
        w="250px"
        bg="black"
        color="white"
        p={6}
        flexShrink={0}
      >
        <Heading size="md" mb={8}>
          CREB.Ai
        </Heading>
        <VStack align="start" spacing={4}>
          <SidebarItem href="/dashboard" icon={FiHome} label="Home" />
          <SidebarItem href="/dashboard?mode=browse" icon={FiSearch} label="Browse" />
          <SidebarItem href="/live-deals" icon={FiRadio} label="Live Deals" />

          <Text fontSize="sm" color="gray.400" mt={6}>
            My Library
          </Text>
          <SidebarItem href="/my-listings" icon={FiList} label="My Listings" />
          <SidebarItem href="/matches" icon={FiHeart} label="Matches" />
          <SidebarItem href="/profile" icon={FiUser} label="Profile" />
        </VStack>
      </Box>

      {/* Main: vertical scroll only */}
      <Box flex="1" overflowY="auto" bg={bg}>
        {children}
      </Box>
    </Flex>
  );
}