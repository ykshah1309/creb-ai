import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Heading,
  useToast,
  Image,
} from "@chakra-ui/react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { useRouter } from "next/router";

export default function PostProperty() {
  const toast = useToast();
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title || !location || !price || !description || !imageFile) {
      toast({
        title: "Missing fields.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("properties")
        .insert([
          {
            title,
            location,
            price: parseInt(price),
            description,
            image_url: publicUrl,
            owner_id: user?.id,
          },
        ]);

      if (insertError) throw insertError;

      toast({
        title: "Property listed!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast({
        title: "Something went wrong.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <DashboardLayout>
      <Box maxW="600px" mx="auto" mt={10}>
        <Heading size="lg" mb={6}>
          Post a New Property
        </Heading>

        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Title</FormLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormControl>

          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </FormControl>

          <FormControl>
            <FormLabel>Price (USD)</FormLabel>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Upload Image</FormLabel>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {previewUrl && (
              <Image src={previewUrl} alt="Preview" mt={2} borderRadius="md" />
            )}
          </FormControl>

          <Button colorScheme="teal" onClick={handleSubmit}>
            Submit
          </Button>
        </VStack>
      </Box>
    </DashboardLayout>
  );
}