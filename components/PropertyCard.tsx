import { Box, Text, Heading, Badge, Image, HStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiMapPin } from "react-icons/fi";

const MotionBox = motion(Box);

export default function PropertyCard({
  property,
  highlight,
  badgeText,
  onClick,
  children,
}: {
  property: any;
  highlight?: boolean;
  badgeText?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <MotionBox
      whileHover={{
        scale: 1.045,
        boxShadow: "0 8px 32px #1ad7ff66",
        y: -8,
        zIndex: 10,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 200, damping: 16 }}
      borderRadius="2xl"
      bg="white"
      boxShadow={highlight ? "0 0 16px 2px #1ad7ff99" : "md"}
      minW={["240px", "320px"]}
      maxW={["260px", "360px"]}
      p={0}
      overflow="hidden"
      cursor="pointer"
      position="relative"
      onClick={onClick}
      role="group"
    >
      {/* Property Image */}
      <Box h="160px" w="100%" bg="gray.100" position="relative">
        <Image
          src={property.image_url || "/no-image.jpg"}
          alt={property.title}
          objectFit="cover"
          w="100%"
          h="100%"
          borderTopRadius="2xl"
          transition="0.2s"
          _groupHover={{ filter: "brightness(0.93)" }}
        />
        {/* Status badge */}
        {(highlight || badgeText) && (
          <Badge
            colorScheme={highlight ? "teal" : "gray"}
            position="absolute"
            top={3}
            right={3}
            fontSize="0.95em"
            px={3}
            py={1}
            borderRadius="xl"
            shadow="md"
          >
            {badgeText || "Matched"}
          </Badge>
        )}
      </Box>
      {/* Info */}
      <Box px={5} pt={4} pb={children ? 0 : 4}>
        <Heading fontSize="xl" mb={1} noOfLines={2}>
          {property.title}
        </Heading>
        <HStack spacing={2} color="gray.500" fontSize="sm" mb={2}>
          <Box as={FiMapPin} /> <Text>{property.location || "—"}</Text>
        </HStack>
        <Text color="teal.500" fontWeight="bold" fontSize="lg" mb={1}>
          {property.price
            ? "$" +
              property.price.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })
            : ""}
        </Text>
        <Text fontSize="sm" color="gray.600" noOfLines={2}>
          {property.description}
        </Text>
        {children}
      </Box>
    </MotionBox>
  );
}