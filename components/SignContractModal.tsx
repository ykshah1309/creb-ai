import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import React, { useRef } from "react";

const SignatureCanvas = dynamic(() => import("react-signature-canvas"), { ssr: false });

export default function SignContractModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const sigPadRef = useRef<any>(null);

  const clear = () => sigPadRef.current && sigPadRef.current.clear();

  const save = () => {
    console.log("sigPadRef.current:", sigPadRef.current);
    if (sigPadRef.current && typeof sigPadRef.current.getTrimmedCanvas === "function") {
      const dataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL("image/png");
      console.log("Signature saved:", dataUrl);
      onClose();
    } else {
      alert("Signature not ready! Try again in a second.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sign the Lease</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box border="1px" borderColor="gray.300" p={2}>
            <SignatureCanvas
              penColor="black"
              canvasProps={{ width: 500, height: 200, className: "sigCanvas" }}
              ref={sigPadRef}
            />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={clear} mr={3}>Clear</Button>
          <Button colorScheme="teal" onClick={save}>Sign</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}