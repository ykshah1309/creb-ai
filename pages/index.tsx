import React from "react";
import {
  Box,
  Button,
  Center,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { FaRocket, FaHandshake, FaBolt, FaMagic, FaEnvelope } from "react-icons/fa";

// Motion-enhanced components
const MotionBox = motion(Box);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);

// User reviews - hardcoded for demo
const REVIEWS = [
  {
    name: "Olivia R.",
    title: "CRE Broker, NYC",
    quote: "CREB.Ai made closing deals fun and fast! The AI agent saved me hours.",
  },
  {
    name: "Mike T.",
    title: "Retail Owner",
    quote: "Found my perfect tenant in one day. Love the swipe-matching!",
  },
  {
    name: "Sophie A.",
    title: "First-time Buyer",
    quote: "Super easy to use, and the AI explained every contract step.",
  },
];

// Features
const FEATURES = [
  {
    icon: FaRocket,
    title: "AI-powered Matching",
    text: "Discover the best commercial properties and partners instantly.",
  },
  {
    icon: FaHandshake,
    title: "Real-Time Chat & Deals",
    text: "Negotiate, share docs, and close—no delays, no paperwork headaches.",
  },
  {
    icon: FaBolt,
    title: "Instant Lease Generation",
    text: "Generate and e-sign compliant leases in minutes, not weeks.",
  },
  {
    icon: FaMagic,
    title: "Simple, Modern Interface",
    text: "Swipe, search, and chat—all in a beautiful, intuitive UI.",
  },
];

export default function LandingPage() {
  const router = useRouter();

  // Mouse & touch parallax
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const blobRef = useRef();

  // Mouse/touch handlers
  useEffect(() => {
    function handleMove(e) {
      let x, y;
      if (e.touches && e.touches.length) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }
      // normalize
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      parallaxX.set((x - centerX) / centerX);
      parallaxY.set((y - centerY) / centerY);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, []);

  // For background blob parallax
  const blobMoveX = useTransform(parallaxX, (v) => v * 40);
  const blobMoveY = useTransform(parallaxY, (v) => v * 40);

  // Review carousel state
  const reviewIndex = useRef(0);
  const reviewAnim = useAnimation();
  const [currentReview, setCurrentReview] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      reviewAnim.start({ opacity: 0, y: 30 }).then(() => {
        setCurrentReview((prev) => (prev + 1) % REVIEWS.length);
        reviewAnim.start({ opacity: 1, y: 0 });
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [reviewAnim]);

  // Responsive values
  const featuresCols = useBreakpointValue({ base: 1, md: 2, lg: 4 });

  return (
    <Box position="relative" minH="100vh" bg="#0b111e" overflow="hidden">
      {/* BACKGROUND EFFECTS */}
      <MotionBox
        ref={blobRef}
        position="absolute"
        top={["8%", "4%", "7%"]}
        left={["-18%", "-13%", "-12%"]}
        w={["260px", "400px", "500px"]}
        h={["210px", "320px", "410px"]}
        bgGradient="linear(to-br, teal.300, cyan.300)"
        filter="blur(85px)"
        opacity={0.38}
        borderRadius="60%"
        style={{
          x: blobMoveX,
          y: blobMoveY,
        }}
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.4, 0.56, 0.4],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        zIndex={1}
      />
      <MotionBox
        position="absolute"
        bottom={["6%", "2%", "5%"]}
        right={["-13%", "-7%", "-13%"]}
        w={["210px", "330px", "390px"]}
        h={["180px", "260px", "330px"]}
        bgGradient="linear(to-br, cyan.400, teal.200)"
        filter="blur(65px)"
        opacity={0.34}
        borderRadius="70%"
        style={{
          x: blobMoveX,
          y: blobMoveY,
        }}
        animate={{
          scale: [1, 1.13, 1],
          opacity: [0.33, 0.49, 0.33],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        zIndex={1}
      />
      {/* Animated grid */}
      <Box
        position="absolute"
        inset={0}
        zIndex={2}
        pointerEvents="none"
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(72,210,224,0.045) 39px), repeating-linear-gradient(0deg, transparent, transparent 38px, rgba(72,210,224,0.045) 39px)",
          animation: "moveGrid 36s linear infinite",
        }}
        _after={{
          content: '""',
          position: "absolute",
          inset: 0,
          bg: "linear-gradient(180deg,rgba(17,27,48,0.0) 60%,rgba(11,17,30,0.7) 100%)",
        }}
      />
      <style global jsx>{`
        @keyframes moveGrid {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 90px 90px, 90px 90px; }
        }
      `}</style>

      {/* HERO SECTION */}
      <Center minH="100vh" zIndex={3} position="relative" pt={["32px", "64px", "80px"]} pb="12">
        <MotionVStack
          spacing={8}
          textAlign="center"
          px={4}
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Heading
            fontSize={["3xl", "5xl", "6xl"]}
            bgGradient="linear(to-r, teal.200, cyan.300, white)"
            bgClip="text"
            fontWeight="extrabold"
            textShadow="0 0 40px #2fe4fa55"
            letterSpacing="tight"
          >
            CREB.Ai
          </Heading>
          <Text
            fontSize={["lg", "xl", "2xl"]}
            color="gray.200"
            maxW="650px"
            fontWeight="medium"
            textShadow="0 0 10px #1de2f750"
            mx="auto"
          >
            Discover, Swipe, and Close Deals on Commercial Real Estate – powered by AI agents.
          </Text>
          <Button
            size="lg"
            px={10}
            py={7}
            fontSize="xl"
            fontWeight="bold"
            color="white"
            bgGradient="linear(to-br, teal.400, cyan.500)"
            boxShadow="0 0 30px 0 #1cefff77"
            _hover={{
              bgGradient: "linear(to-br, teal.300, cyan.400)",
              transform: "scale(1.06)",
              boxShadow: "0 0 48px 0 #10e4ef99",
            }}
            transition="all 0.18s cubic-bezier(.46,.03,.52,.96)"
            onClick={() => router.push("/auth")}
          >
            Get Started
          </Button>
        </MotionVStack>
      </Center>

      {/* USER REVIEWS - Animated Carousel */}
      <Box w="100%" maxW="lg" mx="auto" my={["10", "16"]} px={4} zIndex={4} position="relative">
        <MotionBox
          borderRadius="2xl"
          bg="rgba(26, 32, 44, 0.92)"
          p={[6, 8]}
          shadow="2xl"
          border="1.5px solid"
          borderColor="cyan.700"
          whileHover={{ scale: 1.035, boxShadow: "0 0 50px 0 #2fe4fa88" }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          animate={reviewAnim}
        >
          <Text fontSize={["lg", "xl"]} color="gray.100" mb={2}>"{REVIEWS[currentReview].quote}"</Text>
          <HStack justify="flex-end">
            <Text fontWeight="bold" color="teal.200">{REVIEWS[currentReview].name}</Text>
            <Text fontSize="sm" color="gray.400" ml={2}>| {REVIEWS[currentReview].title}</Text>
          </HStack>
        </MotionBox>
      </Box>

      {/* FEATURES / HOW IT WORKS */}
      <Box maxW="6xl" mx="auto" mt={[10, 16]} px={[3, 6, 10]} zIndex={4} position="relative">
        <Heading
          fontSize={["2xl", "3xl"]}
          color="cyan.200"
          mb={6}
          textAlign="center"
          letterSpacing="tight"
        >
          How CREB.Ai Works
        </Heading>
        <SimpleGrid columns={featuresCols} spacing={[6, 8]} zIndex={4}>
          {FEATURES.map((feat, i) => (
            <MotionBox
              key={feat.title}
              bgGradient="linear(to-br, #171f2a 90%, #1a4047)"
              borderRadius="2xl"
              boxShadow="md"
              px={[5, 8]}
              py={[7, 10]}
              whileHover={{
                scale: 1.07,
                boxShadow: "0 0 50px 8px #15e3fa66",
                y: -8,
                background:
                  "linear-gradient(120deg,#18364e 80%,#1ac7ca)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 180, damping: 17 }}
              cursor="pointer"
              border="1.3px solid"
              borderColor="teal.700"
              display="flex"
              flexDir="column"
              alignItems="center"
              textAlign="center"
            >
              <Icon as={feat.icon} boxSize={10} color="cyan.300" mb={3} />
              <Heading fontSize={["xl", "2xl"]} color="white" mb={2} fontWeight="bold">{feat.title}</Heading>
              <Text color="gray.300" fontSize="md">{feat.text}</Text>
            </MotionBox>
          ))}
        </SimpleGrid>
      </Box>

      {/* WHY CHOOSE US / BENEFITS */}
      <Box maxW="5xl" mx="auto" mt={["14", "24"]} px={[3, 7]} zIndex={4} position="relative">
        <MotionBox
          borderRadius="2xl"
          bgGradient="linear(to-br, rgba(44,83,100,0.97), rgba(51,242,255,0.12))"
          shadow="xl"
          px={[6, 10]}
          py={[8, 12]}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Heading fontSize={["2xl", "3xl"]} color="teal.200" mb={4}>
            Why Choose CREB.Ai?
          </Heading>
          <Stack
            direction={["column", "row"]}
            spacing={[6, 10]}
            align="center"
            justify="center"
            mt={6}
          >
            <Text fontSize="lg" color="white" maxW="320px">
              <b>Fastest Way to Close CRE Deals</b><br />AI agents automate negotiation and paperwork for you.
            </Text>
            <Text fontSize="lg" color="white" maxW="320px">
              <b>Built for All Users</b><br />Sellers, buyers, and brokers—all get a modern, transparent experience.
            </Text>
            <Text fontSize="lg" color="white" maxW="320px">
              <b>Secure & Reliable</b><br />Data stored securely, every step tracked, NYC-compliant leases.
            </Text>
          </Stack>
        </MotionBox>
      </Box>

      {/* CONTACT US SECTION */}
      <Center py={["14", "20"]} zIndex={4} position="relative">
        <MotionBox
          as="form"
          borderRadius="2xl"
          px={[7, 12]}
          py={[7, 10]}
          bg="rgba(20, 32, 52, 0.97)"
          border="2px solid"
          borderColor="cyan.500"
          boxShadow="0 0 38px 5px #25e0ff55"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          maxW="lg"
          w="100%"
          initial={{ opacity: 0, scale: 0.93 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ boxShadow: "0 0 60px 0 #1cefffbb", borderColor: "teal.300" }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        >
          <HStack spacing={4} mb={4}>
            <Icon as={FaEnvelope} boxSize={7} color="cyan.300" />
            <Heading fontSize="2xl" color="white" fontWeight="semibold">
              Contact Us
            </Heading>
          </HStack>
          <Text color="gray.300" mb={6} textAlign="center" maxW="340px">
            Have questions, feedback, or want a demo? <br />
            Email us directly or send a message below!
          </Text>
          <VStack spacing={3} w="100%" maxW="340px">
            <Box
              as="input"
              placeholder="Your Name"
              px={4}
              py={3}
              w="100%"
              borderRadius="md"
              bg="rgba(14,32,52,0.85)"
              color="white"
              border="1px solid #21e3ff"
              _placeholder={{ color: "gray.400" }}
              fontSize="md"
            />
            <Box
              as="input"
              placeholder="Your Email"
              px={4}
              py={3}
              w="100%"
              borderRadius="md"
              bg="rgba(14,32,52,0.85)"
              color="white"
              border="1px solid #21e3ff"
              _placeholder={{ color: "gray.400" }}
              fontSize="md"
            />
            <Box
              as="textarea"
              placeholder="Message"
              px={4}
              py={3}
              w="100%"
              borderRadius="md"
              minH="80px"
              bg="rgba(14,32,52,0.85)"
              color="white"
              border="1px solid #21e3ff"
              _placeholder={{ color: "gray.400" }}
              fontSize="md"
              resize="none"
            />
          </VStack>
          <Button
            mt={6}
            color="white"
            bgGradient="linear(to-br, teal.400, cyan.500)"
            _hover={{
              bgGradient: "linear(to-br, teal.300, cyan.400)",
              transform: "scale(1.06)",
              boxShadow: "0 0 28px 0 #11e3ff88",
            }}
            px={8}
            py={3}
            fontWeight="bold"
            fontSize="lg"
            boxShadow="0 0 16px 0 #11e3ff44"
            type="button"
          >
            Send Message
          </Button>
          <Text fontSize="sm" color="gray.500" mt={4}>
            Or email us: <a href="mailto:hello@creb.ai" style={{ color: "#21e3ff" }}>hello@creb.ai</a>
          </Text>
        </MotionBox>
      </Center>

      {/* FOOTER */}
      <Box w="100%" textAlign="center" py={5} color="gray.500" fontSize="sm" zIndex={4} position="relative">
        &copy; {new Date().getFullYear()} CREB.Ai &mdash; All rights reserved.
      </Box>
    </Box>
  );
}