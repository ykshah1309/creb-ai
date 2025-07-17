import {
  Box,
  Heading,
  Text,
  Avatar,
  FormControl,
  FormLabel,
  Input,
  Button,
  Spinner,
  useToast,
  VStack,
  useColorModeValue,
  Divider,
  Fade,
  HStack,
  Link,
  Icon,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";
import { FiUser } from "react-icons/fi";

interface Profile {
  name: string;
  avatar_url: string | null;
  email: string;
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!user && !userLoading) {
      router.replace("/auth");
    }
  }, [user, userLoading, router]);

  // Load profile data from `users` table
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from<Profile>("users")
        .select("name, avatar_url, email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }
      setProfile(data);
      setName(data.name);
      setAvatarUrl(data.avatar_url || "");
      setAvatarPreview(data.avatar_url || "");
    })();
  }, [user]);

  // Update preview when user edits URL
  useEffect(() => {
    setAvatarPreview(avatarUrl || "");
  }, [avatarUrl]);

  const handleUpdate = async () => {
    if (!user) return;
    setSaving(true);

    const updates = {
      id: user.id,
      name,
      avatar_url: avatarUrl || null,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("users").upsert(updates);
    setSaving(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Profile updated!",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      setProfile({ ...profile!, name, avatar_url: avatarUrl || null, email: profile!.email });
    }
  };

  // Loading
  if (userLoading || !profile) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Fade in={true}>
        <Box
          maxW="420px"
          mx="auto"
          mt={{ base: 8, md: 16 }}
          p={{ base: 4, md: 8 }}
          bg={useColorModeValue("white", "gray.800")}
          borderRadius="2xl"
          boxShadow="xl"
        >
          <HStack spacing={3} mb={3}>
            <Icon as={FiUser} boxSize={8} color="teal.400" />
            <Heading size="lg" fontWeight="extrabold" bgClip="text" bgGradient="linear(to-r, teal.400, blue.400)">
              My Profile
            </Heading>
          </HStack>
          <Text color="gray.500" mb={6}>
            Manage your info and personalize your account.
          </Text>
          <VStack spacing={6} align="stretch">
            {/* Avatar with URL preview */}
            <Box textAlign="center">
              <Avatar
                size="2xl"
                src={avatarPreview || undefined}
                name={name || profile.name}
                mb={3}
                boxShadow="md"
              />
              <Text fontSize="sm" color="gray.400" mb={2}>
                Need an avatar? Try{" "}
                <Link color="teal.500" isExternal href="https://dicebear.com/">DiceBear</Link>
                {" "}or{" "}
                <Link color="teal.500" isExternal href="https://gravatar.com/">Gravatar</Link>
              </Text>
              <Divider my={2} />
            </Box>

            {/* Name Field */}
            <FormControl>
              <FormLabel fontWeight="semibold">Display Name</FormLabel>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your display name"
                borderRadius="xl"
                fontWeight="medium"
              />
            </FormControl>

            {/* Avatar URL Field */}
            <FormControl>
              <FormLabel fontWeight="semibold">Avatar URL</FormLabel>
              <Input
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                borderRadius="xl"
              />
              {avatarUrl && !avatarPreview && (
                <Text color="red.400" fontSize="xs" mt={1}>
                  Invalid image link.
                </Text>
              )}
            </FormControl>

            {/* Email (read-only) */}
            <FormControl>
              <FormLabel fontWeight="semibold">Email</FormLabel>
              <Input
                value={profile.email}
                isReadOnly
                borderRadius="xl"
                bg={useColorModeValue("gray.100", "gray.700")}
                fontWeight="medium"
                color="gray.500"
              />
            </FormControl>

            <Button
              colorScheme="teal"
              size="lg"
              fontWeight="bold"
              borderRadius="xl"
              boxShadow="md"
              isLoading={saving}
              onClick={handleUpdate}
              mt={2}
              _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
              transition="all 0.18s"
            >
              Save Changes
            </Button>
          </VStack>
        </Box>
      </Fade>
    </DashboardLayout>
  );
}