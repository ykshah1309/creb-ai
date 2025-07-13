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

  // form state
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [floor, setFloor] = useState("");
  const [suite, setSuite] = useState("");
  const [sizeSF, setSizeSF] = useState<number>(0);
  const [rentPerSF, setRentPerSF] = useState<number>(0);
  const [annualRent, setAnnualRent] = useState<number>(0);
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [gci3yrs, setGci3yrs] = useState<number>(0);         // <-- note this name
  const [brokerEmail, setBrokerEmail] = useState("");
  const [assoc1, setAssoc1] = useState("");
  const [assoc2, setAssoc2] = useState("");
  const [assoc3, setAssoc3] = useState("");
  const [assoc4, setAssoc4] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // recalc financials on change
  useEffect(() => {
    const ann = sizeSF * rentPerSF;
    setAnnualRent(ann);
    setMonthlyRent(Math.round(ann / 12));
    setGci3yrs(Math.round(ann * 0.12 * 3));
  }, [sizeSF, rentPerSF]);

  // prefill in edit mode
  useEffect(() => {
    if (!isEditMode || !user) return;
    setSaving(true);
    supabase
      .from("properties")
      .select("*")
      .eq("id", id as string)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast({ title: "Load error", description: error?.message, status: "error" });
        } else {
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
        }
      })
      .finally(() => setSaving(false));
  }, [id, isEditMode, user, toast]);

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // 1) build payload and insert/update
      const payload: any = {
        title,
        location: address,
        description: `Floor ${floor}, Suite ${suite}`,
        owner_id: user.id,
        size_sf: sizeSF,
        rent_per_sf: rentPerSF,
        price: annualRent,
        monthly_rent: monthlyRent,
        gci_3yrs: gci3yrs,       // ← correctly map your state here
        broker_email: brokerEmail,
        assoc1,
        assoc2,
        assoc3,
        assoc4,
      };

      let propId: string;
      if (isEditMode) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", id as string);
        if (error) throw error;
        propId = id as string;
      } else {
        const { data: inserted, error } = await supabase
          .from("properties")
          .insert(payload)
          .select("id")
          .single();
        if (error || !inserted) throw error || new Error("Insert failed");
        propId = inserted.id;
      }

      // 2) upload any new images
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${propId}/${Date.now()}.${ext}`;
        const { data: upData, error: upErr } = await supabase.storage
          .from("public")
          .upload(path, file);
        if (upErr) {
          console.error("Upload error:", upErr.message);
          continue;
        }
        const { data: urlData, error: urlErr } = supabase.storage
          .from("public")
          .getPublicUrl(upData.path);
        if (urlErr || !urlData.publicUrl) {
          console.error("URL error:", urlErr?.message);
          continue;
        }
        await supabase
          .from("properties")
          .update({ image_url: urlData.publicUrl })
          .eq("id", propId);
      }

      toast({
        title: isEditMode ? "Updated!" : "Posted!",
        status: "success",
        duration: 3000,
      });
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message, status: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || saving) {
    return (
      <DashboardLayout>
        <Spinner size="xl" m="auto" mt={20} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box maxW="800px" mx="auto" p={6}>
        <Heading mb={6}>{isEditMode ? "Edit Property" : "Post a New Property"}</Heading>

        <Tabs variant="enclosed-colored" colorScheme="teal" isFitted>
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
                  <NumberInput value={sizeSF} min={0} onChange={(_, v) => setSizeSF(v)}>
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
                    min={0}
                    precision={2}
                    onChange={(_, v) => setRentPerSF(v)}
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
                    <Text fontWeight="bold">${annualRent.toLocaleString()}</Text>
                  </VStack>
                  <VStack>
                    <Text fontSize="sm" color="gray.500">Monthly Rent</Text>
                    <Text fontWeight="bold">${monthlyRent.toLocaleString()}</Text>
                  </VStack>
                  <VStack>
                    <Text fontSize="sm" color="gray.500">3-Yr GCI</Text>
                    <Text fontWeight="bold">${gci3yrs.toLocaleString()}</Text>
                  </VStack>
                </HStack>
              </VStack>
            </TabPanel>

            {/* Associates & Media */}
            <TabPanel>
              <VStack
                spacing={6}
                align="stretch"
                divider={<StackDivider borderColor="gray.200" />}
              >
                <FormControl>
                  <FormLabel>Broker Email</FormLabel>
                  <Input
                    type="email"
                    value={brokerEmail}
                    onChange={(e) => setBrokerEmail(e.target.value)}
                  />
                </FormControl>
                {[assoc1, assoc2, assoc3, assoc4].map((val, i) => (
                  <FormControl key={i}>
                    <FormLabel>Associate {i + 1}</FormLabel>
                    <Input
                      value={val}
                      onChange={(e) =>
                        [setAssoc1, setAssoc2, setAssoc3, setAssoc4][i](e.target.value)
                      }
                    />
                  </FormControl>
                ))}
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
          <Button colorScheme="teal" size="lg" onClick={handleSubmit} isLoading={saving}>
            {isEditMode ? "Save Changes" : "Submit"}
          </Button>
        </Flex>
      </Box>
    </DashboardLayout>
  );
}