// pages/profile.tsx
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
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";

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
  const toast = useToast();
  const router = useRouter();

  // Redirect to /auth if not logged in
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
    })();
  }, [user]);

  // Handler to update profile
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
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Profile updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setProfile({ ...profile!, name, avatar_url: avatarUrl || null, email: profile!.email });
    }
  };

  // Show loading spinner while user or profile is loading
  if (userLoading || !profile) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box
        maxW="600px"
        mx="auto"
        mt={10}
        p={6}
        bg={useColorModeValue("white", "gray.700")}
        borderRadius="lg"
        boxShadow="lg"
      >
        <Heading mb={6}>Your Profile</Heading>
        <VStack spacing={6} align="stretch">
          {/* Avatar */}
          <Box textAlign="center">
            <Avatar
              size="2xl"
              src={avatarUrl || undefined}
              name={profile.name}
              mb={4}
            />
            <Text fontSize="sm" color="gray.500">
              Update the URL below to change your avatar.
            </Text>
          </Box>

          {/* Name Field */}
          <FormControl>
            <FormLabel>Display Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
            />
          </FormControl>

          {/* Avatar URL Field */}
          <FormControl>
            <FormLabel>Avatar URL</FormLabel>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </FormControl>

          {/* Email (read-only) */}
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input value={profile.email} isReadOnly />
          </FormControl>

          {/* Save Button */}
          <Button
            colorScheme="teal"
            onClick={handleUpdate}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </VStack>
      </Box>
    </DashboardLayout>
  );
}