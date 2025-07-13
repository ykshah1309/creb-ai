// pages/post-property.tsx

import {
  Box,
  Text,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  VStack,
  HStack,
  Spinner,
  useToast,
  StackDivider,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";

export default function PostPropertyPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const toast = useToast();
  const { id } = router.query;
  const isEditMode = typeof id === "string";

  // Form state
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [floor, setFloor] = useState("");
  const [suite, setSuite] = useState("");
  const [sizeSF, setSizeSF] = useState<number>(0);
  const [rentPerSF, setRentPerSF] = useState<number>(0);
  const [annualRent, setAnnualRent] = useState<number>(0);
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [gci3yrs, setGci3yrs] = useState<number>(0);
  const [brokerEmail, setBrokerEmail] = useState("");
  const [assoc1, setAssoc1] = useState("");
  const [assoc2, setAssoc2] = useState("");
  const [assoc3, setAssoc3] = useState("");
  const [assoc4, setAssoc4] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Recalculate dependent values
  useEffect(() => {
    const ann = sizeSF * rentPerSF;
    setAnnualRent(ann);
    setMonthlyRent(Math.round(ann / 12));
    setGci3yrs(Math.round(ann * 0.12 * 3));
  }, [sizeSF, rentPerSF]);

  // Prefill if editing
  useEffect(() => {
    if (!isEditMode || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id as string)
        .single();
      if (error || !data) {
        toast({ title: "Error loading", description: error?.message, status: "error" });
        return;
      }
      setTitle(data.title);
      setAddress(data.location);
      if (data.description) {
        const [f, s] = data.description.split(",").map((p) => p.trim());
        setFloor(f.replace("Floor ", ""));
        setSuite(s.replace("Suite ", ""));
      }
      setSizeSF(data.size_sf ?? 0);
      setRentPerSF(data.rent_per_sf ?? 0);
      if (data.monthly_rent != null) setMonthlyRent(data.monthly_rent);
      if (data.gci_3yrs != null) setGci3yrs(data.gci_3yrs);
      setBrokerEmail(data.broker_email ?? "");
      setAssoc1(data.assoc1 ?? "");
      setAssoc2(data.assoc2 ?? "");
      setAssoc3(data.assoc3 ?? "");
      setAssoc4(data.assoc4 ?? "");
    })();
  }, [id, isEditMode, user, toast]);

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setUploading(true);

    // Build payload
    const payload = {
      title,
      location: address,
      description: `Floor ${floor}, Suite ${suite}`,
      owner_id: user.id,
      size_sf: sizeSF,
      rent_per_sf: rentPerSF,
      price: annualRent,
      monthly_rent: monthlyRent,
      // ← here we map the JS state `gci3yrs` into the DB column `gci_3yrs`
      gci_3yrs: gci3yrs,
      broker_email: brokerEmail,
      assoc1,
      assoc2,
      assoc3,
      assoc4,
      updated_at: new Date(),
    };

    let propId: string;
    if (isEditMode) {
      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", id as string);
      if (error) {
        toast({ title: "Update failed", description: error.message, status: "error" });
        setUploading(false);
        return;
      }
      propId = id as string;
    } else {
      const { data: inserted, error } = await supabase
        .from("properties")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        toast({ title: "Insert failed", description: error?.message, status: "error" });
        setUploading(false);
        return;
      }
      propId = inserted.id;
    }

    // Upload images
    if (images.length) {
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const filename = `${Date.now()}.${ext}`;
        const path = `${propId}/${filename}`;

        await supabase.storage
          .from("property-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        const { data: urlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(path);

        if (urlData.publicUrl) {
          await supabase
            .from("properties")
            .update({ image_url: urlData.publicUrl })
            .eq("id", propId);
        }
      }
    }

    toast({
      title: isEditMode ? "Updated!" : "Posted!",
      status: "success",
      duration: 3000,
    });
    setUploading(false);
    router.push("/dashboard");
  };

  if (userLoading) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box maxW="800px" mx="auto" p={6}>
        <Heading mb={6}>
          {isEditMode ? "Edit Property" : "Post a New Property"}
        </Heading>

        <Tabs variant="enclosed-colored" colorScheme="teal">
          <TabList mb={4}>
            <Tab>Basic Info</Tab>
            <Tab>Financials</Tab>
            <Tab>Associates & Media</Tab>
          </TabList>
          <TabPanels>
            {/* Basic Info */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Address</FormLabel>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </FormControl>
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Floor</FormLabel>
                    <Input value={floor} onChange={(e) => setFloor(e.target.value)} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Suite</FormLabel>
                    <Input value={suite} onChange={(e) => setSuite(e.target.value)} />
                  </FormControl>
                </HStack>
              </VStack>
            </TabPanel>

            {/* Financials */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Size (SF)</FormLabel>
                  <NumberInput value={sizeSF} onChange={(_, v) => setSizeSF(v)} min={0}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Rent ($/SF/Yr)</FormLabel>
                  <NumberInput
                    value={rentPerSF}
                    onChange={(_, v) => setRentPerSF(v)}
                    precision={2}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <HStack spacing={8} mt={4}>
                  <VStack>
                    <Text fontSize="sm" color="gray.500">Annual Rent</Text>
                    <Heading size="md">${annualRent.toLocaleString()}</Heading>
                  </VStack>
                  <VStack>
                    <Text fontSize="sm" color="gray.500">Monthly Rent</Text>
                    <Heading size="md">${monthlyRent.toLocaleString()}</Heading>
                  </VStack>
                  <VStack>
                    <Text fontSize="sm" color="gray.500">3-Yr GCI</Text>
                    <Heading size="md">${gci3yrs.toLocaleString()}</Heading>
                  </VStack>
                </HStack>
              </VStack>
            </TabPanel>

            {/* Associates & Media */}
            <TabPanel>
              <VStack spacing={6} align="stretch" divider={<StackDivider />}>
                <FormControl>
                  <FormLabel>Broker Email</FormLabel>
                  <Input
                    type="email"
                    value={brokerEmail}
                    onChange={(e) => setBrokerEmail(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Associate 1</FormLabel>
                  <Input value={assoc1} onChange={(e) => setAssoc1(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Associate 2</FormLabel>
                  <Input value={assoc2} onChange={(e) => setAssoc2(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Associate 3</FormLabel>
                  <Input value={assoc3} onChange={(e) => setAssoc3(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Associate 4</FormLabel>
                  <Input value={assoc4} onChange={(e) => setAssoc4(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Property Images</FormLabel>
                  <Input type="file" accept="image/*" multiple onChange={handleFiles} />
                </FormControl>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Flex mt={6}>
          <Spacer />
          <Button colorScheme="teal" size="lg" onClick={handleSubmit} isLoading={uploading}>
            {isEditMode ? "Save Changes" : "Submit"}
          </Button>
        </Flex>
      </Box>
    </DashboardLayout>
  );
}