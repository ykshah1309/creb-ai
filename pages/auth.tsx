import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const toast = useToast();
  const router = useRouter();

  const toggleMode = () => setIsLogin(!isLogin);

  const handleAuth = async () => {
    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: isLogin ? "Logged In" : "Signed Up",
        description: "Redirecting to dashboard...",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => router.push("/dashboard"), 1000);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      toast({
        title: "Google Login Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg={useColorModeValue("gray.50", "gray.900")}>
      <Flex w="full" maxW="4xl" boxShadow="xl" borderRadius="xl" overflow="hidden">
        <Box
          flex="1"
          bg="teal.500"
          color="white"
          p={10}
          display={["none", "none", "flex"]}
          flexDirection="column"
          justifyContent="center"
        >
          <Heading size="2xl" mb={4}>Welcome to CREB.Ai</Heading>
          <Text fontSize="lg">The AI-powered Commercial Real Estate Matchmaker.</Text>
        </Box>

        <Box flex="1" p={[6, 10]}>
          <VStack spacing={6} align="stretch">
            <Heading size="lg" textAlign="center">
              {isLogin ? "Login to your account" : "Create a new account"}
            </Heading>

            <FormControl id="email">
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>

            <FormControl id="password">
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>

            <Button colorScheme="teal" onClick={handleAuth}>
              {isLogin ? "Login" : "Sign Up"}
            </Button>

            <Button leftIcon={<FcGoogle />} variant="outline" onClick={handleGoogleLogin}>
              Continue with Google
            </Button>

            <Text textAlign="center" fontSize="sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <Button variant="link" colorScheme="teal" onClick={toggleMode}>
                {isLogin ? "Sign up" : "Login"}
              </Button>
            </Text>
          </VStack>
        </Box>
      </Flex>
    </Flex>
  );
}