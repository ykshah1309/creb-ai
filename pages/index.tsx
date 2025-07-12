import { Box, Button, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

// Motion-enhanced Box
const MotionBox = motion(Box);

export default function LandingPage() {
  const router = useRouter();

  return (
    <Box
      height="100vh"
      width="100%"
      bgGradient="linear(to-br, #000000, #1a202c)"
      overflow="hidden"
      position="relative"
    >
      {/* Floating glowing background animation */}
      <MotionBox
        position="absolute"
        top="50%"
        left="50%"
        width="300px"
        height="300px"
        bg="teal.400"
        borderRadius="full"
        filter="blur(100px)"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.6, 1, 0.6],
          x: ["-50%", "-55%", "-50%"],
          y: ["-50%", "-45%", "-50%"],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        zIndex={0}
      />

      <Center height="100%" zIndex={1} position="relative">
        <VStack spacing={6} textAlign="center" px={4}>
          <Heading
            fontSize={["3xl", "5xl", "6xl"]}
            color="white"
            textShadow="0 0 20px rgba(0, 255, 255, 0.3)"
          >
            CREB.Ai
          </Heading>
          <Text fontSize={["md", "lg", "xl"]} color="gray.300" maxW="600px">
            Discover, Swipe, and Close Deals on Commercial Real Estate – powered by AI agents.
          </Text>
          <Button
            size="lg"
            colorScheme="teal"
            shadow="lg"
            onClick={() => router.push("/auth")}
          >
            Get Started
          </Button>
        </VStack>
      </Center>
    </Box>
  );
}