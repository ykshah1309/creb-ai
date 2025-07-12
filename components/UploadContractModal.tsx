// components/UploadContractModal.tsx
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
}

export default function UploadContractModal({ isOpen, onClose, matchId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const path = `contract-${matchId}.pdf`;

    const { data, error } = await supabase.storage
      .from("contracts")
      .upload(path, file, { upsert: true });

    if (error) {
      toast({ status: "error", title: "Upload failed", description: error.message });
    } else {
      const url = supabase.storage.from("contracts").getPublicUrl(path).data.publicUrl;
      await supabase.from("matches").update({ contract_url: url }).eq("id", matchId);
      toast({ status: "success", title: "Contract uploaded" });
      onClose();
    }
    setUploading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Upload Lease Contract</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr={3}>Cancel</Button>
          <Button onClick={handleUpload} isLoading={uploading} colorScheme="teal">Upload</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}