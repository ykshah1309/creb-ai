// components/PropertyDetailModal.tsx
import {
  Modal as ChakraModal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Image,
  VStack,
  Text,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { FiHeart, FiXCircle, FiRotateCw } from "react-icons/fi";

export default function PropertyDetailModal({
  property,
  onClose,
  user,
  onLike,
  onCancel,
  onUndo,
  isRejected,
}: {
  property: any;
  onClose: () => void;
  user: any;
  onLike: () => void;
  onCancel: () => void;
  onUndo: () => void;
  isRejected: boolean;
}) {
  return (
    <ChakraModal isOpen={!!property} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{property.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {property.image_url && (
              <Image
                src={property.image_url}
                alt={property.title}
                w="100%"
                h="180px"
                objectFit="cover"
                borderRadius="lg"
                mb={2}
              />
            )}
            <Text fontWeight="bold" fontSize="lg">{property.location}</Text>
            <Text color="gray.600">{property.description}</Text>
            <Text>
              <b>Price:</b> ${property.price}
            </Text>
            <Text>
              <b>Size (SF):</b> {property.size_sf}
            </Text>
            <Text>
              <b>Rent Per SF:</b> ${property.rent_per_sf}
            </Text>
            <Text>
              <b>Monthly Rent:</b> ${property.monthly_rent}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <IconButton
              aria-label="Like"
              icon={<FiHeart />}
              colorScheme="teal"
              variant="outline"
              isDisabled={isRejected}
              onClick={onLike}
              title="Like/Match"
            />
            <IconButton
              aria-label="Cancel"
              icon={<FiXCircle />}
              colorScheme="red"
              variant="outline"
              isDisabled={isRejected}
              onClick={onCancel}
              title="Cancel/Hide"
            />
            <IconButton
              aria-label="Undo"
              icon={<FiRotateCw />}
              colorScheme="yellow"
              variant="outline"
              isDisabled={!isRejected}
              onClick={onUndo}
              title="Undo"
            />
          </HStack>
        </ModalFooter>
      </ModalContent>
    </ChakraModal>
  );
}