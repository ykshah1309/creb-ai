import {
  Box,
  VStack,
  Heading,
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
import { useRouter } from "next/router";
import React from "react";

const SIDEBAR_WIDTH = "250px";

const sidebarItems = [
  { icon: FiHome, label: "Home", path: "/dashboard" },
  { icon: FiSearch, label: "Browse", path: "/dashboard?showSearch=true" },
  { icon: FiRadio, label: "Live Deals", path: "/live-deals" },
  { section: "My Library" },
  { icon: FiList, label: "My Listings", path: "/my-listings" },
  { icon: FiHeart, label: "Matches", path: "/matches" },
  { icon: FiUser, label: "Profile", path: "/profile" },
];

export default function DashboardSidebar({
  onBrowseClick,
}: {
  onBrowseClick?: () => void;
}) {
  const router = useRouter();
  const bg = useColorModeValue("gray.900", "gray.800");

  return (
    <Box
      w={SIDEBAR_WIDTH}
      minW={SIDEBAR_WIDTH}
      maxW={SIDEBAR_WIDTH}
      p={6}
      bg="black"
      color="white"
      minH="100vh"
      position="sticky"
      left={0}
      top={0}
      zIndex={10}
      flexShrink={0}
    >
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
              isActive={
                item.path === "/dashboard"
                  ? router.pathname === "/dashboard"
                  : router.asPath === item.path
              }
              onClick={() =>
                item.label === "Browse"
                  ? onBrowseClick?.()
                  : router.push(item.path)
              }
            />
          )
        )}
      </VStack>
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