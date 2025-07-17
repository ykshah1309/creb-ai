import PropertyCard from "./PropertyCard";

export default function OtherPropertyCard({
  property,
  onClick,
}: {
  property: any;
  onClick?: () => void;
}) {
  return (
    <PropertyCard
      property={property}
      badgeText="Available"
      onClick={onClick}
    />
  );
}