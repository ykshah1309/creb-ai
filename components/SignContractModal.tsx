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
import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";

export default function SignContractModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const sigPad = useRef<any>();

  const clear = () => sigPad.current.clear();

  const save = () => {
    const dataUrl = sigPad.current.getTrimmedCanvas().toDataURL("image/png");
    console.log("Signature saved:", dataUrl);
    onClose();
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
              ref={sigPad}
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