// components/EditPropertyModal.tsx
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useDisclosure,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { FiEdit2 } from "react-icons/fi";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EditPropertyModal({ property, onUpdate }: any) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [form, setForm] = useState({
    title: property.title,
    location: property.location,
    price: property.price,
    description: property.description,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("properties")
      .update({
        title: form.title,
        location: form.location,
        price: +form.price,
        description: form.description,
      })
      .eq("id", property.id);

    if (error) {
      toast({ title: "Failed to update", status: "error" });
    } else {
      toast({ title: "Property updated", status: "success" });
      onUpdate(); // trigger refresh
      onClose();
    }
  };

  return (
    <>
      <IconButton
        icon={<FiEdit2 />}
        aria-label="Edit Property"
        colorScheme="blue"
        onClick={onOpen}
        size="sm"
      />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Property</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>Title</FormLabel>
              <Input name="title" value={form.title} onChange={handleChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Location</FormLabel>
              <Input name="location" value={form.location} onChange={handleChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Price</FormLabel>
              <Input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleUpdate}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}