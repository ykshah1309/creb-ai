import PropertyCard from "./PropertyCard";

export default function MyPropertyCard({ property, onClick }: { property: any; onClick?: () => void }) {
  return (
    <PropertyCard
      property={property}
      badgeText="My Listing"
      onClick={onClick}
    />
  );
}